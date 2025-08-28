import svelte from 'eslint-plugin-svelte';
import tseslint from 'typescript-eslint';
import globals from 'globals';

export default [
  ...svelte.configs.recommended,
  ...svelte.configs.prettier,

  // I added this block as recommended when configuring eslint-plugin-svelte,
  // but I'm not actually sure if it's necessary.
  {
    languageOptions: {
      globals: {
        ...globals.browser,
      }
    }
  },

  // This block is here in order to follow the installation steps from
  // eslint-plugin-svelte
  //
  // https://sveltejs.github.io/eslint-plugin-svelte/user-guide/
  {
    files: ['**/*.svelte', '**/*.svelte.ts', '**/*.svelte.js'],
    languageOptions: {
      parserOptions: {
        projectService: true,
        extraFileExtensions: ['.svelte'],
        parser: tseslint.parser,
      }
    }
  },
];