import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/__tests__/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: [
        'src/pages/SearchLibrary.tsx',
        'src/pages/SearchCreateEdit.tsx',
        'src/pages/FilterPresetLibrary.tsx',
      ],
      thresholds: {
        lines: 60,
        functions: 60,
      },
    },
  },
});
