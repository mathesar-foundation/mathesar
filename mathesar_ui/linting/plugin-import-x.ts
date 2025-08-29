import { createTypeScriptImportResolver } from 'eslint-import-resolver-typescript'
import { importX } from 'eslint-plugin-import-x'
import type { InfiniteDepthConfigWithExtends } from 'typescript-eslint';

/**
 * @file This file stores our configuration for the "import-x" eslint plugin and
 * its rules.
 */

export default [
  {
    settings: {
      'import-x/resolver-next': [
        // @ts-ignore
        createTypeScriptImportResolver(),
      ],
    },
  },

  importX.flatConfigs.recommended,
  importX.flatConfigs.typescript,

  {
    name: 'Turn on extra import rules',
    rules: {
      'import-x/no-extraneous-dependencies': [
        'error',
        { devDependencies: true },
      ],
      'import-x/order': [
        'error',
        {
          alphabetize: {
            order: 'asc',
            orderImportKind: 'asc',
            caseInsensitive: true,
          },
          'newlines-between': 'always',
          groups: [
            'builtin',
            'external',
            'internal',
            'parent',
            'sibling',
            'index',
          ],
        },
      ],
      'import-x/extensions': [
        'error',
        'ignorePackages',
        {
          js: 'never',
          ts: 'never',
        },
      ],
    },
  },

  {
    name: 'Turn off some of the recommended import rules',
    rules: {
      // We're turning this off because it doesn't work well in our project. For
      // example, it reports these imports as duplicates:
      //
      // ```ts
      // import type { ActionReturn } from 'svelte/action';
      // import type { Writable } from 'svelte/store';
      // ```
      //
      // That's because they both ultimately resolve to the following module:
      // `node_modules/svelte/types/index.d.ts`. Furthermore, the auto-fixing
      // logic employed by this rule actually breaks the imports in such cases,
      // creating errors.
      //
      // We have enabled the core eslint rule `no-duplicate-imports` instead.
      'import-x/no-duplicates': 'off',
    },
  },
] satisfies InfiniteDepthConfigWithExtends;
