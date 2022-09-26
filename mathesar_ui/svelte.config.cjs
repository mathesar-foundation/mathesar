const sveltePreprocess = require('svelte-preprocess');

const production = process.env.NODE_ENV === 'production';
module.exports = {
  compilerOptions: {
    dev: !production,
    immutable: true,
  },
  preprocess: sveltePreprocess(),
  vitePlugin: {
    emitCss: true,
    hot: !production,
  },
};
