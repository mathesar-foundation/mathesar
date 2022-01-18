const sveltePreprocess = require('svelte-preprocess');
const data = require('../tsconfig.json');
const path = require("path");

function getAlias() {
  const { paths } = data.compilerOptions;
  const newPaths = {};
  Object.keys(paths).forEach((alias) => {
    const strippedAlias = alias.replace('/*', '');
    newPaths[strippedAlias] = path.resolve(
      __dirname,
      `../${paths[alias][0].replace('/*', '/')}`,
    );
  });
  return newPaths;
}

module.exports = {
  "core": { builder: "webpack5" },
  "webpackFinal": (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      ...getAlias(),
      svelte: path.resolve('node_modules', 'svelte')
    }
    config.resolve.extensions.push(".ts", ".tsx", ".mjs", ".js", ".svelte");
    config.module.rules.push({
      test: /\.scss$/,
      use: ['style-loader', 'css-loader', 'sass-loader'],
      include: path.resolve(__dirname, '../'),
      resolve: {
        alias: {
          "@": path.resolve(__dirname, "../src/"),
        },
      },
    });
    return config;
  },
  "stories": [
    "../src/**/*.stories.mdx",
    "../src/**/*.stories.@(js|jsx|ts|tsx|svelte)"
  ],
  "addons": [
    "@storybook/addon-links",
    "@storybook/addon-essentials",
    "@storybook/addon-svelte-csf",
    "@storybook/addon-docs"
  ],
  "svelteOptions": {
    "preprocess": sveltePreprocess({
      scss: {
        renderSync: true
      }
    })
  }
}
