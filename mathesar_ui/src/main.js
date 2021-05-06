import 'vite/dynamic-import-polyfill';
import App from '@mathesar/App.svelte';

const preloadedData = document.querySelector('#preloaded-data');
let preload = {};
if (preloadedData && preloadedData.textContent) {
  preload = JSON.parse(preloadedData.textContent);
}

const app = new App({
  target: document.body,
  props: {
    preload,
  },
});

export default app;
