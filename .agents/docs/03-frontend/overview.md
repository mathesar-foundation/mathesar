# Frontend overview

This file maps the web client in `mathesar_ui/`: stack, entry points, how Django and Vite serve it, the data Django preloads into the page, the `mathesar_ui/src` layout, import layering, path aliases, and npm scripts.
Read it before any frontend change.
The sibling files cover routing, state, the API client, components, i18n, and tests.

## Existing human docs (read them, they are not repeated here)

| File | What it covers |
|---|---|
| `mathesar_ui/README.md` | Dev setup (Docker or local Node), format, lint and test commands through `docker exec`, adding npm packages, npm audit policy. |
| `mathesar_ui/ARCHITECTURE.md` | Store patterns (immutable class in a store, class holding stores, nested stores), passing stores by props, context or imports, icon storage. |
| `mathesar_ui/STANDARDS.md` | Naming, valid DOM nesting, CSS units and spacing, `await` over `.then`, `function` over `const`, `interface` over `type`, `undefined` over `null`, `$$Props`. |
| `mathesar_ui/src/component-library/README.md` | The three rules of the component library. |
| `mathesar_ui/src/packages/README.md` | Purpose of the `packages` directory. |
| `mathesar_ui/src/packages/json-rpc-client-builder/README.md` | RPC client usage example. |
| `mathesar_ui/src/components/sheet/README.md` | Meaning of each `data-sheet-element` attribute value. |
| `mathesar_ui/src/stores/table-data/records.ts.README.md` | The kinds of row ids and cell ids in the table data stores. |
| `DEVELOPER_GUIDE.md` | Sections "Internationalization" and "Translation process". |

Stale statements in `mathesar_ui/ARCHITECTURE.md`:

- It names a file "src/utils/preload.ts". The real file is `mathesar_ui/src/utils/preloadData.ts`.
- It names "src/api/users.ts", "src/api/types" and "src/api/utils". None exist. API code lives in `mathesar_ui/src/api/rpc/` and `mathesar_ui/src/api/rest/`.
- Its GitHub links pin an old commit. Line anchors do not match current files.
- It mentions "component playbook stories". Storybook is not installed (see `.agents/docs/03-frontend/testing-lint.md`).

## Stack and versions

Versions are the ones locked in `mathesar_ui/package-lock.json`.

| Piece | Package | Version |
|---|---|---|
| UI framework | `svelte` | 3.50.1 |
| Build and dev server | `vite`, `@sveltejs/vite-plugin-svelte` 1.0.8, `@vitejs/plugin-legacy` 2.2.0 | 3.1.3 |
| Language | `typescript` | 4.8.3 |
| Styles | `sass` through `svelte-preprocess` 4.10.7 | 1.55.0 |
| Router | `tinro` | 0.6.12 |
| i18n | `svelte-i18n` | 4.0.0 |
| Tests | `vitest`, `jsdom` 20.0.0, `@testing-library/svelte` 3.2.1 | 0.23.4 |
| Type check | `svelte-check` | 2.9.0 |
| Lint and format | `eslint` 8.23.1 (airbnb base), `prettier` 3.1.0 | |
| Node | 18 (`mathesar_ui/.nvmrc` says v18.17.1, CI and `Dockerfile` use Node 18). Node 22 also runs the dev server, the build and every check (verified in a sandbox). | |

Consequences of Svelte 3:

- There are no runes. Components use `export let`, `$:` statements, slots, and `$store` subscriptions.
- Component generics use `$$Generic`. Prop forwarding uses `$$Props` (see `mathesar_ui/STANDARDS.md`).
- `mathesar_ui/svelte.config.cjs` sets `compilerOptions.immutable: true`. A component does not update when an object or array it holds is mutated in place. Assign a new reference. Use `ImmutableMap`, `ImmutableSet` and the `with...` methods from `mathesar_ui/src/component-library/common/utils/`.

## Entry points

| File | Role |
|---|---|
| `mathesar_ui/src/main.ts` | Mounts the `App` component on `document.body`. |
| `mathesar_ui/src/App.svelte` | Calls `initUiTheme()`, `preloadCommonData()` and `initI18n()`. Renders `AppContext` around `RootRoute`. Holds the global SCSS and app CSS variables. |
| `mathesar_ui/src/AppContext.svelte` | Sets app-wide Svelte contexts (user profile, releases, breadcrumbs, record selector, row seeker, multi tagger, lightbox, file upload, context menu, clipboard). Mounts the single instances of `ToastPresenter`, `Confirmation`, `ModalRecordSelector` and similar overlays. |
| `mathesar_ui/src/routes/RootRoute.svelte` | Top of the route tree. |
| `mathesar_ui/src/i18n/languages/en/index.ts` (and `es`, `fr`, `ja`) | Separate Vite entries, one per language. Each puts its dictionary on `window.Mathesar.translations`. |

`mathesar_ui/src/App.svelte` wraps the route tree in `{#key $locale}`. A language change destroys and rebuilds the whole UI.

## How the page is served

Django always renders `mathesar/templates/mathesar/index.html`. The template variables come from the context processor `frontend_settings` in `config/context_processors.py`. The mode comes from the `MODE` environment variable (`MATHESAR_MODE` in `config/settings/common_settings.py`). The default is `PRODUCTION`.

Development (`MODE=DEVELOPMENT`, set by `docker-compose.dev.yml`):

1. `bin/mathesar_dev` starts `npm run dev` (Vite, port 3000, `host: true`) and `manage.py runserver 0.0.0.0:8000`.
2. The template emits `<script type="module">` tags for `{{ client_dev_url }}/@vite/client`, `{{ client_dev_url }}/src/main.ts`, and the language entry.
3. `client_dev_url` is the request scheme, the request hostname, and `MATHESAR_CLIENT_DEV_PORT` (default `3000`). The browser must reach port 3000 on the same hostname it uses for Django on port 8000.
4. `STATICFILES_DIRS` contains `mathesar_ui/` in this mode, so Django serves frontend source assets under `/static/`. Vite `base` is `/static/`.
5. Hot module replacement is on unless `VITEST` is set (`mathesar_ui/svelte.config.cjs`).

Production:

1. `npm run build` writes to the `mathesar` folder under `mathesar/static/` (git-ignored, absent until the first build, emptied on each build) and creates a Vite manifest file there. The settings `MATHESAR_UI_BUILD_LOCATION` and `MATHESAR_MANIFEST_LOCATION` point to them.
2. `get_manifest_data` in `mathesar/utils/frontend.py` reads the manifest entries for the main module, its legacy variant, the legacy polyfills, and the modern and legacy language modules for each entry of `LANGUAGES`. It caches the result for one hour.
3. The template emits the module script, CSS links, and `nomodule` legacy scripts.
4. `collectstatic` runs in `Dockerfile`. WhiteNoise serves the files (`STORAGES["staticfiles"]`).
5. `build-scripts/package/package.py` runs `npm ci` and `npm run build` for packaged installs.

Gotchas:

- Without `MODE=DEVELOPMENT` and without a build, `get_manifest_data` opens a manifest file that does not exist. It runs in a context processor, so every template render fails.
- The manifest keys in `get_manifest_data` are hard-coded entry paths. Renaming an entry in `mathesar_ui/vite.config.js` requires the same change in `mathesar/utils/frontend.py`.

## Data preloaded into the page

Each Django view that serves the app passes `common_data` to the template. The template writes it with `json_script` into an element with id `common-data`. `get_common_data` in `mathesar/views/__init__.py` builds it. `preloadCommonData()` in `mathesar_ui/src/utils/preloadData.ts` parses it and defines the types `CommonData`, `AuthenticatedCommonData` and `AnonymousCommonData`.

| Key | Present for | Content |
|---|---|---|
| `current_release_tag_name`, `is_authenticated`, `is_sso_login_required`, `per_user_databases_enabled`, `supported_languages`, `file_backends` | everyone | Base flags from `get_base_common_data`. |
| `routing_context` | everyone | `'normal'` for logged-in users, `'anonymous'` otherwise. |
| `user` | logged in | Result of `users.get` for the current user. |
| `databases`, `servers` | logged in | Results of `databases.configured.list` and `servers.configured.list`. |
| `current_database`, `current_schema` | logged in | Ids from the URL (views `database_route` and `schema_route`) when they match a listed database and schema, else `null`. |
| `schemas` | logged in | `{state: 'success', data}` or `{state: 'failure', error}`. Empty unless the URL names a database. |
| `tables` | logged in | Same wrapper. Result of `tables.list_with_metadata`. Empty unless the URL names a schema. |
| `queries` | logged in | Saved explorations of the current schema. Not wrapped. |
| `internal_db` | logged in | Host, port and name of the internal database. |

Facts to know:

- `mathesar_ui/src/stores/databases.ts`, `mathesar_ui/src/stores/schemas.ts`, `mathesar_ui/src/stores/tables.ts` and `mathesar_ui/src/stores/queries.ts` call `preloadCommonData()` at module load. They seed themselves from it once, then fetch over RPC after navigation.
- `preloadCommonData()` throws when the element is missing. Any unit test that imports those modules needs the element in the DOM first.
- To add a key, change the Python builder and the TS interface together.
- The template also supports `route_specific_data`, and `preloadRouteData` exists in TS. No view passes it today.

## Directory map of `mathesar_ui/src`

| Directory | What belongs there |
|---|---|
| `mathesar_ui/src/api/rpc/` | Typed declarations of backend JSON-RPC methods and their request and response types. One file per backend namespace. |
| `mathesar_ui/src/api/rest/` | The few non-RPC HTTP endpoints (uploads) and older request helpers such as `RequestStatus`. |
| `mathesar_ui/src/3rd-party-apis/` | Calls to services outside Mathesar. Only `mathesar_ui/src/3rd-party-apis/github-releases.ts`. |
| `mathesar_ui/src/component-library/` | Generic UI kit with no Mathesar knowledge. |
| `mathesar_ui/src/components/` | Mathesar-specific components reused by several systems or pages. |
| `mathesar_ui/src/systems/` | Large feature units with their own controllers and sub-components (table view, data explorer, record selector). |
| `mathesar_ui/src/pages/` | One folder per page: page shell, title, and page-only components. |
| `mathesar_ui/src/routes/` | tinro route components and the URL builders in `mathesar_ui/src/routes/urls.ts`. |
| `mathesar_ui/src/layouts/` | Three page layout wrappers. |
| `mathesar_ui/src/stores/` | App state: entity stores, table data stores, abstract types, async store classes, toast, modal and confirmation singletons. |
| `mathesar_ui/src/models/` | Classes that wrap raw API objects (`Database`, `Schema`, `Table`, `Role`, `DataForm`). |
| `mathesar_ui/src/contexts/` | Route-scoped context classes and context helpers. |
| `mathesar_ui/src/i18n/` | svelte-i18n setup and one dictionary per language, such as `mathesar_ui/src/i18n/languages/en/dict.json`. |
| `mathesar_ui/src/icons/` | App icon constants (`mathesar_ui/src/icons/index.ts`) and custom SVG paths (`mathesar_ui/src/icons/customIcons.ts`). |
| `mathesar_ui/src/packages/` | Self-contained helpers: `json-rpc-client-builder`, `new-item-highlighter`, `svelte-device-info`, `tuple-map`. |
| `mathesar_ui/src/utils/` | Helpers and small classes without UI. |

Top-level files: `mathesar_ui/src/AppTypes.ts` (a few shared types), `mathesar_ui/src/geometry.ts` (sheet pixel constants), `mathesar_ui/src/typeUtils.ts`, `mathesar_ui/src/global.d.ts` (declares `window.Mathesar`).

## Layering

One rule is written down and holds today: nothing in `mathesar_ui/src/component-library/` imports from outside that directory (zero violations found by grep). No lint rule enforces any layer.

Observed import direction, from counting imports:

```
routes -> pages -> systems -> components -> component-library
all of the above -> stores, models, contexts, api, utils, icons, i18n
```

| Layer | Never imports (zero found) | Known exceptions to the direction above |
|---|---|---|
| `component-library` | anything outside itself | none |
| `api` | `components`, `systems`, `pages`, `routes` | `mathesar_ui/src/api/rpc/explorations.ts` imports a type from `mathesar_ui/src/stores/abstract-types/`. |
| `models` | `components`, `systems`, `pages`, `routes` | Models import `mathesar_ui/src/stores/AsyncRpcApiStore.ts`. |
| `stores` | `pages`, `routes` | `mathesar_ui/src/stores/table-data/` imports from `mathesar_ui/src/components/sheet/`, `mathesar_ui/src/components/cell-fabric/` and `mathesar_ui/src/components/filter/`. `mathesar_ui/src/stores/table-data/processedColumns.ts` imports from `mathesar_ui/src/systems/record-selector/`. |
| `components` | `pages` | `mathesar_ui/src/components/cell-fabric/` imports controllers from `mathesar_ui/src/systems/record-selector/`, `mathesar_ui/src/systems/row-seeker/` and `mathesar_ui/src/systems/multi-tagger/`. Many components import `mathesar_ui/src/routes/urls.ts`. |
| `systems` | | `mathesar_ui/src/systems/table-view/` and `mathesar_ui/src/systems/record-view/` import `mathesar_ui/src/pages/table/ImperativeFilterController.ts`. |

Where new code goes:

| You are adding | Put it in |
|---|---|
| A binding or type for a backend RPC method | `mathesar_ui/src/api/rpc/` |
| A generic widget with no Mathesar concepts and no app imports | `mathesar_ui/src/component-library/`, exported from its index file, styles imported in `mathesar_ui/src/component-library/styles.scss` |
| A reusable Mathesar-aware component | `mathesar_ui/src/components/` |
| A feature with controllers, several components and its own state | a folder in `mathesar_ui/src/systems/` |
| A new URL | route in `mathesar_ui/src/routes/`, page in `mathesar_ui/src/pages/`, builder in `mathesar_ui/src/routes/urls.ts`, and a Django pattern (see `.agents/docs/03-frontend/routing-pages.md`) |
| State shared across pages | `mathesar_ui/src/stores/` |
| State scoped to a database or schema route | a class in `mathesar_ui/src/contexts/` |
| Behavior of one API entity | a method on its class in `mathesar_ui/src/models/` |
| A UI string | `mathesar_ui/src/i18n/languages/en/dict.json` (see `.agents/docs/03-frontend/i18n.md`) |

## Path aliases

Defined in `mathesar_ui/tsconfig.json` under `paths`. `mathesar_ui/vite.config.js` derives the Vite aliases from that file.

| Alias | Target | Use |
|---|---|---|
| `@mathesar/*` | `mathesar_ui/src/*` | All app imports. |
| `@mathesar-component-library` | `mathesar_ui/src/component-library/index.ts` | App code importing library exports. Used by about 530 files. |
| `@mathesar-component-library/types` | `mathesar_ui/src/component-library/types.ts` | Library types. |
| `@mathesar-component-library-dir/*` | `mathesar_ui/src/component-library/*` | Imports inside the library itself. |

`@mathesar/component-library` also resolves and about 100 files use it. Prefer `@mathesar-component-library` in new app code.
SCSS files do not support aliases. `mathesar_ui/src/App.svelte` imports the library stylesheet by relative path.

## npm scripts

Run from `mathesar_ui/`. Details and failure modes are in `.agents/docs/03-frontend/testing-lint.md`.

| Script | Command | Purpose |
|---|---|---|
| `npm run dev` | `vite` | Dev server on port 3000. Only useful together with Django. |
| `npm run build` | `vite build` | Production bundle into the `mathesar` folder under `mathesar/static/`. |
| `npm run lint` | `eslint .` | Type-aware lint. `npm run lint-fix` applies fixes and sorts imports. |
| `npm run check-format` | `prettier --check .` | Format check. `npm run format` rewrites files. |
| `npm run typecheck` | `svelte-check --tsconfig tsconfig.json --threshold warning .` | Type check of `.ts` and `.svelte`. |
| `npm test` | `vitest` | Unit tests. Watches unless `CI` is set. |
| `npm run extract-i18n` | `svelte-i18n extract ...` | Extracts message ids. Nothing else in the repo references this script. |

## Related docs

- Run the stack: `.agents/docs/01-setup/install-sandbox.md` and `.agents/docs/01-setup/drive-the-app.md`.
- Backend RPC layer: `.agents/docs/02-backend/rpc.md`.
- Feature index: `.agents/docs/04-features/index.md`.
