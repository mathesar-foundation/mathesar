import { globalIgnores } from "eslint/config";
import eslintPluginJs from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';

import pluginImportX from './plugin-import-x';
import pluginSvelte from './plugin-svelte';
import pluginEslintComments from './plugin-eslint-comments';
import pluginPromise from './plugin-promise';

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

  eslintPluginJs.configs.recommended,
  tseslint.configs.recommended,
  pluginImportX,
  pluginSvelte,
  pluginEslintComments,
  pluginPromise,
  prettier, // This needs to come last because its purpose is to DISABLE rules
);
