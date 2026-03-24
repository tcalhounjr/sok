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
        // Sprint 001 pages
        'src/pages/SearchLibrary.tsx',
        'src/pages/SearchCreateEdit.tsx',
        'src/pages/FilterPresetLibrary.tsx',
        // Sprint 002 pages
        'src/pages/SearchDetail.tsx',
        'src/pages/LineageExplorer.tsx',
        'src/pages/CollectionManagement.tsx',
        // Sprint 003 pages and components
        'src/pages/NarrativeTrends.tsx',
        'src/components/search/ForkModal.tsx',
      ],
      thresholds: {
        lines: 60,
        functions: 60,
      },
    },
  },
});
