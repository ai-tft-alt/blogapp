// 대용량 로그 생성기: node scripts/generate-logs.mjs [줄 수]
// 결과: logs/app.log (기본 200,000줄). 난수 시드가 고정되어 항상 같은 파일이 만들어진다.
import { createWriteStream, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const logDir = path.join(rootDir, 'logs');
const logFile = path.join(logDir, 'app.log');

const totalLines = Number.parseInt(process.argv[2] ?? '200000', 10);
if (!Number.isInteger(totalLines) || totalLines <= 0) {
  console.error('사용법: node scripts/generate-logs.mjs [줄 수(양의 정수)]');
  process.exit(1);
}

// mulberry32: 시드 고정 PRNG
function createRandom(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const random = createRandom(20260314);
const pick = (items) => items[Math.floor(random() * items.length)];
const int = (min, max) => min + Math.floor(random() * (max - min + 1));

const START = Date.parse('2026-03-14T00:00:00.000Z');
const SPAN_MS = 3 * 24 * 60 * 60 * 1000; // 3일
const SPIKE_START = Date.parse('2026-03-15T14:00:00.000Z');
const SPIKE_END = SPIKE_START + 60 * 60 * 1000; // 1시간
const SUSPICIOUS_USER = 4242;
const MODULES = ['auth', 'posts', 'comments', 'uploads', 'db'];

const messages = {
  INFO: {
    auth: () => `login success userId=${int(1, 500)} ip=10.0.${int(0, 9)}.${int(1, 254)}`,
    posts: () =>
      `${pick(['GET', 'GET', 'GET', 'POST', 'PUT'])} /api/v1/posts status=200 durationMs=${int(3, 120)} postId=${int(1, 3000)}`,
    comments: () => `comment created postId=${int(1, 3000)} userId=${int(1, 500)}`,
    uploads: () =>
      `image stored file=${int(100000, 999999)}.${pick(['png', 'jpg', 'webp'])} sizeKb=${int(20, 4000)} userId=${int(1, 500)}`,
    db: () => `query ok model=${pick(['User', 'Post', 'Comment'])} durationMs=${int(1, 40)}`,
  },
  WARN: {
    auth: () => `token expired userId=${int(1, 500)}`,
    posts: () => `slow request path=/api/v1/posts durationMs=${int(800, 3000)}`,
    comments: () => `comment rejected reason=validation postId=${int(1, 3000)}`,
    uploads: () => `image near size limit sizeKb=${int(4500, 5100)} userId=${int(1, 500)}`,
    db: () => `slow query model=${pick(['Post', 'Comment'])} durationMs=${int(500, 2500)}`,
  },
  ERROR: {
    auth: () => `login failed userId=${int(1, 500)} reason=invalid_password`,
    posts: () => `unhandled error path=/api/v1/posts/${int(1, 3000)} code=INTERNAL_ERROR`,
    comments: () => `failed to create comment postId=${int(1, 3000)} code=FOREIGN_KEY`,
    uploads: () =>
      `upload failed error=${pick(['ENOENT', 'File too large'])} userId=${int(1, 500)}`,
    db: () => `connection error code=SQLITE_BUSY retry=${int(1, 3)}`,
  },
};

function spikeLine() {
  const error = pick(['ENOENT', 'ENOENT', 'File too large', 'EACCES']);
  const detail =
    error === 'ENOENT'
      ? `path=uploads/${int(100000, 999999)}.png`
      : error === 'File too large'
        ? `sizeKb=${int(5200, 20000)} limitKb=5120`
        : 'path=uploads';
  return ['ERROR', 'uploads', `upload failed error="${error}" ${detail} userId=${int(1, 500)}`];
}

function failedLoginLine() {
  return [
    'WARN',
    'auth',
    `login failed userId=${SUSPICIOUS_USER} reason=invalid_password ip=203.0.113.${int(10, 20)}`,
  ];
}

function normalLine() {
  const r = random();
  const level = r < 0.85 ? 'INFO' : r < 0.95 ? 'WARN' : 'ERROR';
  const mod = pick(MODULES);
  return [level, mod, messages[level][mod]()];
}

mkdirSync(logDir, { recursive: true });
const out = createWriteStream(logFile, { encoding: 'utf8' });

const step = SPAN_MS / totalLines;
let buffer = '';
for (let i = 0; i < totalLines; i += 1) {
  const ts = Math.floor(START + i * step + random() * step);
  let entry;
  if (ts >= SPIKE_START && ts < SPIKE_END && random() < 0.3) {
    entry = spikeLine();
  } else if (random() < 0.004) {
    entry = failedLoginLine();
  } else {
    entry = normalLine();
  }
  const [level, mod, message] = entry;
  buffer += `${new Date(ts).toISOString()} ${level} [${mod}] ${message} requestId=${int(1e8, 1e9 - 1).toString(16)}\n`;
  if (buffer.length > 1 << 20) {
    out.write(buffer);
    buffer = '';
  }
}
out.end(buffer, () => {
  console.log(
    `[logs] ${path.relative(rootDir, logFile)} 생성 완료 (${totalLines.toLocaleString()}줄)`,
  );
});
