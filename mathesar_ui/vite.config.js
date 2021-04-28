import { defineConfig } from 'vite';
import legacy from '@vitejs/plugin-legacy';
import svelte from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  plugins: [
    svelte(),
    legacy({
      targets: ['defaults', 'not IE 11'],
    }),
  ],
  build: {
    manifest: true,
    target: 'es2015',
    rollupOptions: {
      input: './src/main.js',
    },
  },
});
