import 'vite/dynamic-import-polyfill';
import App from '@mathesar/App.svelte';

const app = new App({
  target: document.body,
});

export default app;
