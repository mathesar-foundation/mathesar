import { globalIgnores } from "eslint/config";
import prettier from 'eslint-config-prettier';
import tseslint from 'typescript-eslint';

import eslintConfig from './eslint';
import typescriptEslintConfig from './typescript-eslint';
import pluginImportXConfig from './plugin-import-x';
import pluginSvelteConfig from './plugin-svelte';
import pluginEslintCommentsConfig from './plugin-eslint-comments';
import pluginPromiseConfig from './plugin-promise';

export default tseslint.config(
  // This block disables linting on these code paths, relative to the directory
  // containing eslint.config.ts.
  globalIgnores([
    'dist',
    'vendor',
    'index.html',
    'src/**/*.stories.svelte',
    '*.cjs',
  ]),

  eslintConfig,
  typescriptEslintConfig,
  pluginImportXConfig,
  pluginSvelteConfig,
  pluginEslintCommentsConfig,
  pluginPromiseConfig,

  prettier, // This needs to come last because its purpose is to DISABLE rules
);
