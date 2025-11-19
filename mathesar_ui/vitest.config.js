import { defineConfig } from 'vitest/config';
import svelte from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  plugins: [svelte()],
  test: {
    environment: 'jsdom', // important for Svelte onMount
  },
});
