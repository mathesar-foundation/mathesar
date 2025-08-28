import { createTypeScriptImportResolver } from 'eslint-import-resolver-typescript'
import { importX, type PluginFlatConfig } from 'eslint-plugin-import-x'

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
  }
] satisfies PluginFlatConfig[];
