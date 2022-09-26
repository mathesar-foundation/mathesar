import { defineConfig } from 'vite';
import legacy from '@vitejs/plugin-legacy';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import path from 'path';
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
      input: './src/main.ts',
    },
    outDir: '../mathesar/static/mathesar/',
    emptyOutDir: true,
  },
  base: '/static/',
});
