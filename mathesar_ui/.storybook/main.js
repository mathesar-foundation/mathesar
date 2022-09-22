const { mergeConfig } = require('vite');
const preprocess = require('svelte-preprocess');
const data = require('../tsconfig.json');
const path = require('path');

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

module.exports = {
  core: { builder: '@storybook/builder-vite' },
  async viteFinal(config) {
    return mergeConfig(config, {
      resolve: {
        alias: getAlias(),
        dedupe: ["@storybook/client-api"],
      },
    });
  },
  stories: [
    '../src/**/*.stories.mdx',
    '../src/**/*.stories.@(js|jsx|ts|tsx|svelte)',
  ],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-svelte-csf',
    '@storybook/addon-docs',
  ],
  svelteOptions: {
    preprocess: preprocess(),
  },
};
