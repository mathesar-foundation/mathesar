import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import playwright from 'eslint-plugin-playwright';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['node_modules', 'test-results', 'playwright-report'] },
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    files: ['eslint.config.mjs'],
    ...tseslint.configs.disableTypeChecked,
  },
  {
    // Playwright reads the fixtures a function needs from its first parameter,
    // which must be an object pattern even when it is empty.
    files: ['support/fixtures.ts', 'tests/**/fixtures.ts'],
    rules: { 'no-empty-pattern': 'off' },
  },
  {
    files: ['tests/**/*.ts'],
    ...playwright.configs['flat/recommended'],
    rules: {
      ...playwright.configs['flat/recommended'].rules,
      // Selectors belong in support/ui, so that a markup change is fixed in one place.
      'playwright/no-raw-locators': 'error',
      'playwright/no-wait-for-timeout': 'error',
      'playwright/no-force-option': 'error',
      'playwright/no-skipped-test': ['warn', { allowConditional: true }],
      'playwright/expect-expect': [
        'error',
        { assertFunctionPatterns: ['^expect[A-Z]'] },
      ],
    },
  },
  {
    // A teardown removes what the run created and checks nothing.
    files: ['tests/setup/*.teardown.ts'],
    rules: { 'playwright/expect-expect': 'off' },
  },
  prettier,
);
