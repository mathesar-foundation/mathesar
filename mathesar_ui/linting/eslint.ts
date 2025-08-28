import { type InfiniteDepthConfigWithExtends } from 'typescript-eslint';
import eslintPluginJs from '@eslint/js';
import globals from 'globals';

/**
 * @file This file stores our configuration for the top-level eslint
 * set of rules.
 */

export default [
  eslintPluginJs.configs.recommended,

  {
    languageOptions: {
      // This makes ESLint aware of global symbols. Without it, ESLint would
      // report failures for rules like "no-undef"
      globals: {
        // This pulls in global symbols present in a browser context, e.g.
        // `setTimeout`.
        ...globals.browser,

        // This tells ESLint to expect a global symbol called `$$Generic`. We
        // have this in some Svelte 4 code like `type Item = $$Generic`.  We'll
        // probably be able to remove this global symbol definition when we
        // migrate to Svelte 5 which has a different way of defining
        // component-level generic types.
        '$$Generic': "readonly",
      },
    },
  },

] satisfies InfiniteDepthConfigWithExtends;
