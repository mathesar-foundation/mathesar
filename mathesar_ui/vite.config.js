import path from 'path';

import { svelte } from '@sveltejs/vite-plugin-svelte';
import legacy from '@vitejs/plugin-legacy';
import { defineConfig } from 'vite';

import * as data from './tsconfig.json';

function getAlias() {
  const alias = [];
  const { paths } = data.compilerOptions;
  Object.keys(paths).forEach((key) => {
    const find = (__dirname, key.replace('/*', ''));
    const replacement = path.resolve(paths[key][0].replace('/*', ''));
    alias.push({
      find,
      replacement,
    });
  });
  return alias;
}

export default defineConfig({
  resolve: {
    alias: getAlias(),
  },
  plugins: [
    svelte(),
    legacy({
      targets: ['defaults', 'not IE 11'],
    }),
  ],
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
