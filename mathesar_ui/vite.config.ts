import { svelte } from '@sveltejs/vite-plugin-svelte';
import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';

import tsconfig from './tsconfig.json';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getAlias() {
  const alias: Array<{ find: string; replacement: string }> = [];
  const paths: Record<string, string[]> = tsconfig.compilerOptions.paths;
  Object.keys(paths).forEach((key) => {
    const find = key.replace('/*', '');
    const replacement = path.resolve(
      __dirname,
      paths[key][0].replace('/*', ''),
    );
    alias.push({ find, replacement });
  });
  return alias;
}

export default defineConfig({
  resolve: {
    alias: getAlias(),
  },
  plugins: [svelte()],
  optimizeDeps: {
    exclude: ['tinro'],
  },
  server: {
    port: 3000,
    host: true,
  },
  build: {
    manifest: true,
    rollupOptions: {
      input: {
        main: './src/main.ts',
        en: './src/i18n/languages/en/index.ts',
        ja: './src/i18n/languages/ja/index.ts',
      },
    },
    outDir: '../mathesar/static/mathesar/',
    emptyOutDir: true,
  },
  base: '/static/',
  test: {
    environment: 'jsdom',
    globals: true,
    testTimeout: 30000,
    setupFiles: ['vitest-setup.config.ts'],
  },
});
