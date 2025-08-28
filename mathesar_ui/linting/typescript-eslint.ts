import tseslint, { type InfiniteDepthConfigWithExtends } from 'typescript-eslint';

/**
 * @file This file stores configuration for the typescript-eslint plugin and its
 * associated rules.
 */

export default [
  tseslint.configs.recommended,
  {
    name: "Turn off recommended typescript-eslint rules that we don't want to follow globally",
    rules: {
      // This if off because we have quite a bit of it across our codebase
      "@typescript-eslint/ban-ts-comment": 'off',

      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          "args": "all",
          "argsIgnorePattern": "^_",
          "caughtErrors": "all",
          "caughtErrorsIgnorePattern": "^_",
          "destructuredArrayIgnorePattern": "^_",
          "varsIgnorePattern": "^_",
          "ignoreRestSiblings": true
        }
      ]
    }
  },
  {
    name: "Turn off recommended typescript-eslint rules that we don't want to follow in Svelte files",
    files: ['**/*.svelte'],
    rules: {
      // This is off because we have seemingly-unused expressions in reactive
      // statements. But Svelte relies on these expressions as dependencies to
      // evaluate the reactive statement. We might consider removing this
      // override (i.e. turning the rule back on as recommended) after we
      // migrate to Svelte 5.
      "@typescript-eslint/no-unused-expressions": 'off',

      // This is customized to account for the way we sometimes need to define
      // unused types like $$Props inside svelte components.
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { varsIgnorePattern: '^\\$\\$(Props|Events|Slots)$' },
      ],
    }
  },
] satisfies InfiniteDepthConfigWithExtends;