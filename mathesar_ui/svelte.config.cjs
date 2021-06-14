const sveltePreprocess = require('svelte-preprocess');

const production = process.env.NODE_ENV === 'production';
module.exports = {
  emitCss: true,
  compilerOptions: {
    dev: !production,
    immutable: true,
  },
  preprocess: sveltePreprocess(),
  hot: !production,
};
