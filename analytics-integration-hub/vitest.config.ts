import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    testTimeout: 15000,
    pool: 'forks',
  },
  resolve: {
    alias: {
      '@domain': new URL('./src/domain', import.meta.url).pathname,
      '@application': new URL('./src/application', import.meta.url).pathname,
      '@infrastructure': new URL('./src/infrastructure', import.meta.url).pathname,
      '@interfaces': new URL('./src/interfaces', import.meta.url).pathname,
    },
  },
});
