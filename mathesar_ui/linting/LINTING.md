# Linting

to lint our codebase, we use [ESLint](https://eslint.org/) along with some additional packages to provide extra rules and configuration.

## Packages we use

### ESLint

This is the main linting tool that we configure and run. It comes with hundreds of rules. We don't use them all.

- [Website](https://eslint.org/)
- [Repo](https://github.com/eslint/eslint)
- [Rules](https://eslint.org/docs/latest/rules/)

### typescript-eslint

This adds more rules to catch type-specific issues and other issues using awareness of types.

- [Website](https://typescript-eslint.io/)
- [Repo](https://github.com/typescript-eslint/typescript-eslint)
- [Rules](https://typescript-eslint.io/rules/)

### @eslint/js

This is an eslint plugin supplied directly from the main eslint project. Its purpose is to provide a narrower set of rules which target only the stuff that typescript-eslint _won't_ catch. We installed and configured this as recommended by the [typescript-eslint installation instructions](https://typescript-eslint.io/getting-started).

### eslint-plugin-import-x

This adds rules to keep our imports clean.

- [Repo](https://github.com/un-ts/eslint-plugin-import-x)
- [Rules](https://github.com/un-ts/eslint-plugin-import-x?tab=readme-ov-file#rules)

### eslint-import-resolver-typescript

This is a low-level utility which helps eslint-plugin-import-x resolve imports using aliases defined in our tsconfig.json. It does not add any eslint rules or config.

- [Repo](https://github.com/import-js/eslint-import-resolver-typescript)

### eslint-plugin-svelte

This adds rules to keep our Svelte code clean.

- [Repo](https://github.com/sveltejs/eslint-plugin-svelte)
- [Rules](https://sveltejs.github.io/eslint-plugin-svelte/rules/)

### eslint-plugin-promise

This adds rules to catch issues with promises.

- [Repo](https://github.com/eslint-community/eslint-plugin-promise)
- [Rules](https://github.com/eslint-community/eslint-plugin-promise?tab=readme-ov-file#rules)

### eslint-plugin-eslint-comments

This provides additional strictness for cases where we turn off linting via directive comments like `// eslint-disable-line`

- [Repo](https://github.com/eslint-community/eslint-plugin-eslint-comments)
- [Docs](https://eslint-community.github.io/eslint-plugin-eslint-comments/)

### eslint-config-prettier

This provides additional configuration to turn _off_ the eslint rules that prettier handles via auto-formatting.

- [Repo](https://github.com/prettier/eslint-config-prettier)


