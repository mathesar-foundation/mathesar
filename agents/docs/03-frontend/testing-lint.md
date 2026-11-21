# Frontend tests, lint, format, type check, build

This file lists the exact commands that verify a frontend change, what CI runs, what the unit tests cover, and the failures you are likely to hit.
Read it before you declare a frontend change done.

`mathesar_ui/README.md` documents the same commands through `docker exec` and explains how to write a basic test. This file adds the configuration facts and the gotchas.

## Commands

Run them from `mathesar_ui/` after `npm ci`. CI uses Node 18 (`mathesar_ui/.nvmrc`). Node 22 also passes every command below. Setup is in `agents/docs/01-setup/install-sandbox.md`.

| Check | Command | CI job in `.github/workflows/test-and-lint-code.yml` |
|---|---|---|
| Format check | `npm run check-format` | `front_end_format` |
| Format fix | `npm run format` | |
| Lint | `npm run lint` | `front_end_lint` |
| Lint with fixes | `npm run lint-fix` | |
| Type check | `npm run typecheck` | `front_end_typecheck` |
| Unit tests, one run | `npx vitest run` or `CI=true npm test` | `front_end_tests` (runs `npm test`) |
| Unit tests, one file | `npx vitest run TextInput` (file name filter) | |
| Production build | `npm run build` | `build_tests` and `package` (indirectly) |
| Dependency audit | none locally | `front_end_audit` |

Inside the dev container the working directory is `/code/mathesar_ui`, for example `docker exec -w /code/mathesar_ui mathesar_service_dev npm run lint`. The README examples add `-it`, which needs a terminal.

Recommended order before finishing: `npm run format`, `npm run lint-fix`, `npm run typecheck`, `npx vitest run`.

Without Docker, `agents/bin/check frontend` runs the format check, lint, type check and unit tests in that order and stops at the first failure.

Measured on a 4-core sandbox (Ubuntu 24.04, Node 22):

| Command | Time |
|---|---|
| `npm ci` | 9 s with a warm npm cache |
| `npm run check-format` | 13 s |
| `npm run lint` | 70 s |
| `npm run typecheck` | 15 s |
| `npx vitest run` | 13 s (34 files, 350 tests) |
| `npm run build` | 54 s |

## What CI runs

- The workflow triggers on `pull_request` and `merge_group`.
- The five `front_end_*` jobs run only when a file under `mathesar_ui/` changed (job `front_end_checks_required`). A frontend-relevant change elsewhere, such as `mathesar/urls.py` or a template, does not trigger them.
- Each job uses Node 18. The format, lint, type check and test jobs run `npm ci --no-audit --prefer-offline`, then one command.
- Job timeouts: 5 minutes for format, lint, type check and audit. 15 minutes for tests.
- `front_end_audit` runs an npm audit action at level `moderate` on production dependencies with `continue-on-error: true`.
- `build_tests` builds the Docker image for the `production` and `development` targets on every pull request that changes a path outside `.github/build-skip-paths.txt`, and always in the merge queue. The production target runs `build-scripts/package/package.py`, which runs `npm ci` and `npm run build`. A broken Vite build fails there.
- `package` runs the same script outside Docker with Node 18.
- The `checkpoint` job fails the pull request if any required job failed.
- No CI job runs the scripts in `mathesar_ui/scripts/i18n/`.
- There are no browser or end-to-end tests of the frontend in this workflow.

`lint.sh` at the repo root runs `npm run lint` when staged changes touch `mathesar_ui/`. It can serve as a pre-commit hook (see `DEVELOPER_GUIDE.md`, "Full-stack linting").

## Test runner and configuration

| Item | Value | Where |
|---|---|---|
| Runner | `vitest` 0.23.4 | `mathesar_ui/package.json` |
| Config | `test` block: `environment: 'jsdom'`, `globals: true`, `testTimeout: 30000`, `setupFiles` | `mathesar_ui/vite.config.js` |
| Setup file | Loads the `en` dictionary and initializes `svelte-i18n` before all tests | `mathesar_ui/vitest-setup.config.ts` |
| Component testing | `@testing-library/svelte` 3.2.1, `@testing-library/jest-dom`, `@testing-library/user-event` | `mathesar_ui/package.json` |
| Globals | `test`, `describe`, `expect`, `vi` need no import (`vitest/globals` in `mathesar_ui/tsconfig.json`) | |

Conventions:

- Test files are named `*.test.ts` and sit next to the code in a folder named `__tests__`. In the component library, component tests sit in a folder named `__meta__`.
- Tests import code through the same aliases as the app (`@mathesar/...`).
- Pure logic tests are plain `test(...)` blocks with several `expect` calls. Component tests use `render` and `fireEvent` or `userEvent`.
- A test that touches code importing `svelte-i18n` in plain TS can mock it. See `mathesar_ui/src/stores/table-data/__tests__/utils.test.ts`.

## What the tests cover today

There are 34 test files. Eight of them render components. The rest test pure functions and classes.

| Area | Test files | What is tested |
|---|---|---|
| `mathesar_ui/src/component-library/` | 23 | Utilities (`ImmutableMap`, `ImmutableSet`, `CancellablePromise`, store, string and filter utils), number formatting, formatted input, pagination math, form factory, and render tests for `Button`, `Icon`, `InputGroup`, `Select`, `Skeleton`, `TextInput`, `NumberInput`. |
| `mathesar_ui/src/components/` | 5 | Form library, `RichText` parser, sheet selection `Plane` and `Series`, `SteppedInputCell`. |
| `mathesar_ui/src/stores/` | 1 | `getRowStatus` in the table data utils. |
| `mathesar_ui/src/utils/` | 5 | Request status helper, db utils, iterator utils, pattern matching, duration formatter. |
| `mathesar_ui/src/systems/`, `mathesar_ui/src/pages/`, `mathesar_ui/src/routes/`, `mathesar_ui/src/api/`, `mathesar_ui/src/models/`, `mathesar_ui/src/contexts/`, `mathesar_ui/src/packages/` | 0 | Nothing. |

Not covered by any automated test: the table view, the Data Explorer, forms, routing, the entity stores, `TabularData`, `RecordsData`, the RPC client and its type declarations, permissions UI, import. Verify changes in those areas by driving the running app (`agents/docs/01-setup/drive-the-app.md`) in addition to lint and type check.

When you add logic, extract it into a pure function or an immutable class and test that. This matches the existing tests and avoids DOM and network setup.

## Lint, format and type rules to know

From `mathesar_ui/.eslintrc.cjs`, `mathesar_ui/.prettierrc` and `mathesar_ui/tsconfig.json`:

| Rule | What to do |
|---|---|
| `import/order` with alphabetical groups and blank lines between groups | Do not sort by hand. Run `npm run lint-fix`. |
| `@typescript-eslint/consistent-type-imports` and `importsNotUsedAsValues: error` | Import types with `import type { X }` or inline `type X`. |
| `svelte/block-lang` | Every component needs `<script lang="ts">`, even an empty one. Styles are `lang="scss"` or plain. |
| `@intlify/svelte/no-raw-text` | No literal UI text in Svelte markup outside the component library. See `agents/docs/03-frontend/i18n.md`. |
| `sort-keys` on JSON under `mathesar_ui/src/` | Dictionary keys must be sorted. `npm run format` sorts them. |
| `@typescript-eslint/explicit-member-accessibility` (`no-public`) | Do not write the `public` keyword on class members. |
| `@typescript-eslint/ban-ts-comment` | `@ts-ignore` and `@ts-expect-error` need a description of at least 10 characters. |
| `no-console` (warning) | Only `console.error` is allowed. |
| type-aware rules (`recommended-requiring-type-checking`) | Floating promises must be awaited or prefixed with `void`. No unsafe `any` access in `.ts` files. |
| Prettier | Single quotes, trailing commas, Svelte plugin. Ignores Markdown, `mathesar_ui/package-lock.json` and `mathesar_ui/tsconfig.json`. |
| `strict: true` in `mathesar_ui/tsconfig.json` | No implicit `any`, strict null checks. |

`npm run typecheck` shows warnings and errors. The script does not pass `--fail-on-warnings`.
ESLint skips `*.stories.svelte` and `*.cjs` files. `mathesar_ui/tsconfig.json` excludes the stories too.

## Common failure modes

1. `npm test` never exits. vitest 0.23.4 defaults to watch mode unless the `CI` environment variable is set. Use `npx vitest run` or `CI=true npm test`.
2. A test fails at import with "commonData is undefined". The module, or something it imports, calls `preloadCommonData()` at load. This applies to `mathesar_ui/src/stores/databases.ts`, `mathesar_ui/src/stores/schemas.ts`, `mathesar_ui/src/stores/tables.ts` and `mathesar_ui/src/stores/queries.ts`, and to everything that imports them. Move the logic under test into a module without that import.
3. Lint reports dozens of import order errors after an edit. Run `npm run lint-fix`.
4. Lint fails on raw text in markup. Add a dictionary key.
5. `check-format` fails on a JSON or SCSS file you did not expect. Prettier checks every file type it knows in `mathesar_ui/`. Run `npm run format`.
6. The component renders stale data although the store changed. `compilerOptions.immutable` is on (`mathesar_ui/svelte.config.cjs`). Replace objects and arrays instead of mutating them.
7. `npm run build` deletes and rewrites the `mathesar` folder under `mathesar/static/` (`emptyOutDir: true`). That folder is git-ignored. Do not commit build output.
8. `mathesar_ui/package-lock.json` changes after `npm install`. Use `npm ci`. Add or remove packages only on purpose, with Node 18, and commit the lock file change with it (see `mathesar_ui/README.md`).
9. Type check passes but the RPC call fails at runtime. The types in `mathesar_ui/src/api/rpc/` are handwritten. Compare with the Python signature (`agents/docs/03-frontend/api-client.md`).
10. `npm run lint` is the slow step (about a minute). Run `npx eslint <files>` on the files you touched while iterating, and the full lint before you finish.

## Leftovers that look like tooling but are not used

- `*.stories.svelte` and `*.mdx` files in the `__meta__` folders: Storybook was removed (`mathesar_ui/src/component-library/README.md`). `Dockerfile` and `docker-compose.dev.yml` still expose port 6006.
- `mathesar_ui/__mocks__/fileMock.cjs`: nothing references it.
- The `extract-i18n` npm script: nothing references it.
