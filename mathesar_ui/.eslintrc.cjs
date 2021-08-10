const typescript = require('typescript');

module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  ignorePatterns: ['node_modules', 'dist', 'index.html', 'storybook-static'],
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: ['./tsconfig.json'],
    extraFileExtensions: ['.svelte', '.cjs'],
  },
  plugins: [
    'svelte3',
    'jest',
    '@typescript-eslint',
  ],
  extends: [
    'airbnb-typescript/base',
    'plugin:eslint-comments/recommended',
    'plugin:promise/recommended',
    'plugin:jest/recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
  ],
  rules: {
    'import/no-extraneous-dependencies': ['error', { devDependencies: true }],
  },
  overrides: [
    {
      files: [
        '*.svelte',
      ],
      processor: 'svelte3/svelte3',
      rules: {
        'import/first': 'off',
        'import/no-duplicates': 'off',
        'import/no-mutable-exports': 'off',
        'import/no-unresolved': 'off',
        'import/prefer-default-export': 'off',
        'no-multiple-empty-lines': 'off',
        '@typescript-eslint/no-unsafe-member-access': 'off',
        'no-void': 'off',
        'no-useless-escape': 'off',
        'no-underscore-dangle': 'off',
        'no-bitwise': 'off',
      },
    },
    {
      files: [
        '*.cjs', '*.config.js',
      ],
      rules: {
        '@typescript-eslint/no-var-requires': 'off',
        '@typescript-eslint/no-unsafe-assignment': 'off',
        '@typescript-eslint/no-unsafe-call': 'off',
        '@typescript-eslint/no-unsafe-return': 'off',
        '@typescript-eslint/no-unsafe-member-access': 'off',
        '@typescript-eslint/restrict-template-expressions': 'off',
        '@typescript-eslint/explicit-module-boundary-types': 'off',
      },
    },
    {
      files: ['*.ts'],
      rules: {
        'import/extensions': [
          'error',
          'ignorePackages',
          {
            js: 'never',
            ts: 'never',
          },
        ],
        'import/prefer-default-export': 'off',
        'no-void': 'off',
        'no-underscore-dangle': 'off',
      },
    },
  ],
  env: {
    es6: true,
    browser: true,
    node: true,
    'jest/globals': true,
  },
  settings: {
    'svelte3/typescript': () => typescript,
    'import/resolver': {
      node: {
        extensions: ['.js', '.ts'],
        moduleDirectory: ['node_modules', 'src/'],
      },
      typescript: {},
    },
    jest: {
      version: 26,
    },
  },
};
