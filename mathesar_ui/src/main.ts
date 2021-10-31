// TODO: Uncomment based on https://github.com/vitejs/vite/issues/4786
// import 'vite/modulepreload-polyfill';
import App from '@mathesar/App.svelte';

const app = new App({
  target: document.body,
});

export default app;
