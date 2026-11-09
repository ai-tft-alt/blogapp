import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

export const backendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const envFile = path.join(backendRoot, '.env');

if (existsSync(envFile)) {
  dotenv.config({ path: envFile, quiet: true });
} else if (!process.env.DATABASE_URL) {
  console.warn('[config] apps/backend/.env 파일이 없어 기본값을 사용합니다.');
}

process.env.DATABASE_URL ??= 'file:./dev.db';

export const config = {
  port: Number(process.env.PORT ?? 3000),
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET ?? 'blogapp-dev-secret',
  jwtExpiresIn: '7d',
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
  uploadDir: path.join(backendRoot, 'uploads'),
  maxUploadBytes: 5 * 1024 * 1024,
} as const;
