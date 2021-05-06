import { defineConfig } from 'vite';
import legacy from '@vitejs/plugin-legacy';
import svelte from '@sveltejs/vite-plugin-svelte';
import sveltePreprocess from 'svelte-preprocess';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: [
      { find: '@mathesar', replacement: path.resolve(__dirname, 'src') },
      { find: '@mathesar-components', replacement: path.resolve(__dirname, 'src/components') },
    ],
  },
  plugins: [
    svelte({
      compilerOptions: {
        immutable: true,
      },
      preprocess: sveltePreprocess(),
    }),
    legacy({
      targets: ['defaults', 'not IE 11'],
    }),
  ],
  optimizeDeps: {
    exclude: ['tinro'],
  },
  build: {
    manifest: true,
    rollupOptions: {
      input: './src/main.js',
    },
  },
});
