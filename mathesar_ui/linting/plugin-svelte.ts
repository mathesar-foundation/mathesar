import svelte from 'eslint-plugin-svelte';
import { type InfiniteDepthConfigWithExtends, parser } from 'typescript-eslint';


/**
 * @file This file stores our configuration for the "svelte" eslint plugin and
 * its rules.
 */

export default [
  ...svelte.configs.recommended,
  ...svelte.configs.prettier,

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
        parser,
      }
    }
  },

  {
    name: 'Turn off some of the rules that Svelte recommends',
    rules: {
      // This is off because we have quite a bit of it across our codebase. We
      // could potentially refactor this out.
      "svelte/no-immutable-reactive-statements": 'off',

      // This is off because we have a lot of it across our codebase. I'm not
      // sure this would be easy to refactor out, and I'm a bit confused about
      // why eslint-plugin-svelte complains about some of these cases (e.g.
      // binding to a store obtained via reactive destructuring).
      "svelte/no-reactive-reassign": "off",

      // This is off because we have some of it across our codebase. It might be
      // a good idea to ignore the failures individually and then turn on this
      // rule.
      "svelte/require-each-key": "off",

      // Ideally we'd have this on. But we have quite a bit of this code across
      // our codebase. It might be a good idea to ignore the failures
      // individually and then turn on this rule.
      "svelte/require-event-dispatcher-types": "off",
    },
  }
] satisfies InfiniteDepthConfigWithExtends;