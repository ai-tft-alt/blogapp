// DB 준비 스크립트: node scripts/db.mjs <setup|reset>
// - setup: prisma migrate deploy → 시드 (재실행 가능)
// - reset: SQLite 파일 삭제 → prisma migrate deploy → 시드
import { spawnSync } from 'node:child_process';
import { existsSync, rmSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const backendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const prismaDir = path.join(backendRoot, 'prisma');
const envFile = path.join(backendRoot, '.env');

if (existsSync(envFile)) {
  dotenv.config({ path: envFile, quiet: true });
} else if (!process.env.DATABASE_URL) {
  console.warn(
    '[db] apps/backend/.env 파일이 없어 기본값(DATABASE_URL="file:./dev.db")을 사용합니다.',
  );
}
process.env.DATABASE_URL ??= 'file:./dev.db';

const require = createRequire(import.meta.url);
const prismaCli = require.resolve('prisma/build/index.js');

function run(args) {
  const result = spawnSync(process.execPath, args, {
    cwd: backendRoot,
    stdio: 'inherit',
    env: process.env,
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function sqliteFilePath(url) {
  if (!url.startsWith('file:')) {
    throw new Error(`SQLite DATABASE_URL만 지원합니다: ${url}`);
  }
  const filePart = url.slice('file:'.length).split('?')[0];
  return path.resolve(prismaDir, filePart);
}

function removeDatabaseFile() {
  const dbFile = sqliteFilePath(process.env.DATABASE_URL);
  for (const file of [dbFile, `${dbFile}-journal`]) {
    if (existsSync(file)) rmSync(file, { force: true });
  }
  console.log(`[db] 삭제: ${path.relative(backendRoot, dbFile)}`);
}

function migrate() {
  run([prismaCli, 'migrate', 'deploy']);
}

function seed() {
  run(['--import', 'tsx', 'prisma/seed.ts']);
}

const command = process.argv[2];
if (command === 'setup') {
  migrate();
  seed();
} else if (command === 'reset') {
  removeDatabaseFile();
  migrate();
  seed();
} else {
  console.error('사용법: node scripts/db.mjs <setup|reset>');
  process.exit(1);
}
