import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    // Tests run against a real Postgres, so they share one database and must
    // not interleave. See docs/decisions/0009-testing-against-a-real-database.md.
    fileParallelism: false,
    testTimeout: 20_000,
  },
});
