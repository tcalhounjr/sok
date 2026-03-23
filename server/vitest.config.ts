import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/resolvers/**/*.ts'],
      exclude: ['src/resolvers/index.ts'],
      thresholds: {
        lines: 70,
      },
    },
  },
});
