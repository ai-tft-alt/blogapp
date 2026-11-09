import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const backendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// 테스트 전용 SQLite(prisma/test.db)를 db.mjs reset과 같은 방식으로 새로 만든다.
export default function setup() {
  execFileSync(process.execPath, ['scripts/db.mjs', 'reset'], {
    cwd: backendRoot,
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: 'file:./test.db' },
  });
}
