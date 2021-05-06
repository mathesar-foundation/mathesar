import { defineConfig } from 'vite';
import legacy from '@vitejs/plugin-legacy';
import svelte from '@sveltejs/vite-plugin-svelte';
import sveltePreprocess from 'svelte-preprocess';
import path from 'path';

const production = process.env.NODE_ENV === 'production';
export default defineConfig({
  resolve: {
    alias: [
      { find: '@mathesar', replacement: path.resolve(__dirname, 'src') },
      { find: '@mathesar-components', replacement: path.resolve(__dirname, 'src/components') },
    ],
  },
  plugins: [
    svelte({
      emitCss: true,
      compilerOptions: {
        dev: !production,
        immutable: true,
      },
      preprocess: sveltePreprocess(),
      hot: !production,
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
