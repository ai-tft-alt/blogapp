import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    globalSetup: ['tests/global-setup.ts'],
    env: { DATABASE_URL: 'file:./test.db', JWT_SECRET: 'test-secret' },
    fileParallelism: false,
    testTimeout: 20000,
    hookTimeout: 60000,
  },
});
