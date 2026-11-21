# Routing and pages

This file explains how URLs map to route components, page components, and state.
Read it before adding a page, changing a URL, or debugging a "not found" screen.
It also covers the Django side of each URL, permission gating, and the anonymous shared-form entry point.

## The router

- The router is `tinro` 0.6.12. Routes are declared as nested `<Route>` components, not in a config file.
- All route components are in `mathesar_ui/src/routes/`. The tree starts at `mathesar_ui/src/routes/RootRoute.svelte`.
- A child `<Route path="...">` is relative to its parent route. A parent must end its path with `/*` to have children.
- `firstmatch` on a parent renders only the first matching child. `fallback` marks the child shown when nothing matches. `redirect="..."` redirects.
- `let:meta` exposes `meta.params` (strings) and `meta.query`. Route components parse ids with `parseInt(value, 10)`.
- tinro handles clicks on internal `<a href>` links without a page load. Links that must reach Django carry `tinro-ignore` or `data-tinro-ignore` (logout in `mathesar_ui/src/components/AppHeader.svelte`, export links in `mathesar_ui/src/systems/table-view/table-inspector/table/TableActions.svelte`).
- Code navigates with `router.goto(url)` and reads `$router` (`path`, `query`, `hash`) from `tinro`.

Route helper components:

| Component | Use |
|---|---|
| `mathesar_ui/src/components/routing/EventfulRoute.svelte` | A `Route` with `onLoad` and `onUnload` callbacks. Used to set the active section tab. |
| `mathesar_ui/src/components/routing/MultiPathRoute.svelte` | Renders one slot for several paths without remounting it when the path switches. Used for the two Data Explorer URLs. |
| `mathesar_ui/src/components/routing/RouteObserver.svelte` | Calls callbacks from a route's `meta`. The root route uses it to send logged-out users to `/auth/login/`. |

## Two routers must agree

Django decides whether a URL returns the app shell. tinro decides what the shell shows. A new client URL needs both.

Django patterns in `mathesar/urls.py` that render `mathesar/templates/mathesar/index.html`:

| Django pattern | View in `mathesar/views/__init__.py` | Preloads |
|---|---|---|
| `''` | `home` | No current database, so schemas, tables and explorations are empty. Redirects to login when logged out. |
| `profile/` | `profile` | same |
| `administration/`, `administration/users/`, `administration/users/new/`, `administration/users/<int>/`, `administration/update/`, `administration/settings/` | `admin_home` | same |
| `^db/<id>/((schemas or settings)/)?` (prefix match) | `database_route` | schemas of that database |
| `^db/<id>/schemas/<id>/` (prefix match) | `schema_route` | schemas, tables and explorations of that schema |
| `^shares/forms/<token>/?` | `anonymous_route_home` | base data only, no login required |

- The two `db/` patterns have no end anchor. Every deeper client URL (tables, records, import, explorations, forms) is served by `schema_route`.
- The `administration/` patterns are exact. A new admin sub-page needs a new Django pattern.
- `handler404` in `config/urls.py` is `page_not_found_view`. It renders the same shell with HTTP status 404. A client-only URL then works after in-app navigation but gets a 404 status on reload.
- With `DEBUG=True` (the default in the dev setups), Django shows its own debug 404 page instead of calling `handler404`. Reloading a client-only URL then shows a Django error page, not the app.
- Login, password reset and installation pages are server-rendered Django templates. They are not part of the Svelte app.

## Route table

"Schema prefix" means `/db/:databaseId/schemas/:schemaId`.

| URL pattern | Route component | Page component | Main system or store |
|---|---|---|---|
| `/` | `mathesar_ui/src/routes/AuthenticatedRoutes.svelte` | `mathesar_ui/src/pages/home/HomePage.svelte` | `mathesar_ui/src/stores/databases.ts`, `mathesar_ui/src/systems/databases/` |
| `/profile` | `mathesar_ui/src/routes/UserProfileRoute.svelte` | `mathesar_ui/src/pages/user-profile/ProfilePage.svelte` | `mathesar_ui/src/stores/userProfile.ts`, `mathesar_ui/src/systems/users/` |
| `/administration/` | `mathesar_ui/src/routes/AdminRoute.svelte` | redirect to `/administration/update/` | |
| `/administration/update` | `mathesar_ui/src/routes/AdminRoute.svelte` | `mathesar_ui/src/pages/admin-update/SoftwareUpdatePage.svelte` | `mathesar_ui/src/stores/releases.ts` |
| `/administration/users` | `mathesar_ui/src/routes/UsersRoute.svelte` | `mathesar_ui/src/pages/admin-users/UserListingPage.svelte` | `mathesar_ui/src/stores/users.ts` |
| `/administration/users/new` | `mathesar_ui/src/routes/UsersRoute.svelte` | `mathesar_ui/src/pages/admin-users/NewUserPage.svelte` | same |
| `/administration/users/:userId` | `mathesar_ui/src/routes/UsersRoute.svelte` | `mathesar_ui/src/pages/admin-users/EditUserPage.svelte` | same |
| `/administration/settings` | `mathesar_ui/src/routes/AdminRoute.svelte` | `mathesar_ui/src/pages/admin-settings/SettingsPage.svelte` | `api.analytics` through `mathesar_ui/src/stores/AsyncRpcApiStore.ts` |
| `/db/:databaseId/` | `mathesar_ui/src/routes/DatabaseRoute.svelte` | redirect to `schemas/` | |
| `/db/:databaseId/schemas` | `mathesar_ui/src/routes/DatabaseRoute.svelte` | `mathesar_ui/src/pages/database/DatabasePageWrapper.svelte` with `mathesar_ui/src/pages/database/schemas/SchemasSection.svelte` | `mathesar_ui/src/stores/schemas.ts`, `mathesar_ui/src/contexts/DatabaseRouteContext.ts` |
| `/db/:databaseId/settings/roles` | `mathesar_ui/src/routes/DatabaseSettingsRoute.svelte` | `mathesar_ui/src/pages/database/settings/roles/Roles.svelte` | `mathesar_ui/src/contexts/DatabaseSettingsRouteContext.ts` |
| `/db/:databaseId/settings/role-configuration` | `mathesar_ui/src/routes/DatabaseSettingsRoute.svelte` | `mathesar_ui/src/pages/database/settings/role-configuration/RoleConfiguration.svelte` | same |
| `/db/:databaseId/settings/collaborators` | `mathesar_ui/src/routes/DatabaseSettingsRoute.svelte` | `mathesar_ui/src/pages/database/settings/collaborators/Collaborators.svelte` | same, plus `mathesar_ui/src/contexts/CollaborationFeaturesContext.ts` |
| Schema prefix `/` | `mathesar_ui/src/routes/SchemaRoute.svelte` | `mathesar_ui/src/pages/schema/SchemaPage.svelte` | `mathesar_ui/src/stores/tables.ts`, `mathesar_ui/src/stores/queries.ts`, `mathesar_ui/src/contexts/SchemaRouteContext.ts` |
| Schema prefix `/tables/:tableId/` | `mathesar_ui/src/routes/TableRoute.svelte` | `mathesar_ui/src/pages/table/TablePage.svelte` | `TabularData` in `mathesar_ui/src/stores/table-data/`, `mathesar_ui/src/systems/table-view/` |
| Schema prefix `/tables/:tableId/:recordPk` | `mathesar_ui/src/routes/RecordPageRoute.svelte` | `mathesar_ui/src/pages/record/RecordPage.svelte` | `mathesar_ui/src/systems/record-view/RecordStore.ts` |
| Schema prefix `/import/` | `mathesar_ui/src/routes/ImportRoute.svelte` | `mathesar_ui/src/pages/import/upload/ImportUploadPage.svelte` | `mathesar_ui/src/api/rest/dataFiles.ts`, `createTableFromDataFile` in `mathesar_ui/src/stores/tables.ts` |
| Schema prefix `/import/:tableIdString` | `mathesar_ui/src/routes/ImportRoute.svelte` | `mathesar_ui/src/pages/import/preview/ImportPreviewPage.svelte` | `mathesar_ui/src/stores/AsyncStore.ts`, `getTableFromStoreOrApi` |
| Schema prefix `/data-explorer/` | `mathesar_ui/src/routes/DataExplorerRoute.svelte` | `mathesar_ui/src/pages/data-explorer/DataExplorerPage.svelte` | `QueryManager` in `mathesar_ui/src/systems/data-explorer/` |
| Schema prefix `/explorations/:queryId` | `mathesar_ui/src/routes/DataExplorerRoute.svelte` | `mathesar_ui/src/pages/data-explorer/DataExplorerPage.svelte` | same, loaded with `getExploration` from `mathesar_ui/src/stores/queries.ts` |
| Schema prefix `/explorations/:queryId/edit` | `mathesar_ui/src/routes/DataExplorerRedirect.svelte` | redirect to the URL without `/edit` | |
| Schema prefix `/forms/:formId/` | `mathesar_ui/src/routes/DataFormRoute.svelte` | `mathesar_ui/src/pages/data-forms/DataFormEditorPage.svelte` | `mathesar_ui/src/contexts/DataFormRouteContext.ts`, `mathesar_ui/src/systems/data-forms/` |
| `/shares/forms/:token/` | `mathesar_ui/src/routes/AnonymousAccessRoutes.svelte`, then `mathesar_ui/src/routes/SharedFormRoute.svelte` | `mathesar_ui/src/pages/shared-data-form/SharedDataFormFillPage.svelte` | `api.forms.get`, `mathesar_ui/src/systems/data-forms/form-maker/` |

Ids in URLs: `databaseId` is the Django id of the configured database. `schemaId` and `tableId` are PostgreSQL OIDs. `recordPk` is the primary key value as a string.

Shared pages: `mathesar_ui/src/pages/ErrorPage.svelte` and `mathesar_ui/src/pages/LoadingPage.svelte`.

## URL builders

Never build app URLs by hand. Use `mathesar_ui/src/routes/urls.ts`.

- Page URLs: `getDatabasePageUrl`, `getSchemaPageUrl`, `getTablePageUrl`, `getTablePageUrlByTable`, `getRecordPageUrl`, `getRecordPageUrlByTable`, `getImportPageUrl`, `getImportPreviewPageUrl`, `getDataExplorerPageUrl`, `getExplorationPageUrl`, `getDataFormPageUrl`, `getFormShareUrl`, `getEditUsersPageUrl`.
- Constants: `USER_PROFILE_URL`, `ADMIN_URL`, `ADMIN_UPDATE_PAGE_URL`, `ADMIN_USERS_PAGE_URL`, `ADMIN_SETTINGS_PAGE_URL`, `LOGOUT_URL`.
- External links: `getDocsLink(page)` for `docs.mathesar.org` and `getMarketingLink(page)` for `mathesar.org`. Add new targets to the `docsPages` or `marketingPages` maps.
- Builders return paths with a trailing slash, except `getRecordPageUrl`.

State carried in the URL:

| Where | Mechanism |
|---|---|
| Table page | Query parameter `q`. It holds `Meta.serialization` (pagination, sorting, grouping, filtering, joining, hidden columns) as Url64-encoded JSON. See `.agents/docs/03-frontend/state-stores.md`. |
| Import preview | Query parameters `inference` and `renamed_id_column`, parsed by `getImportPreviewPageQueryParams`. |
| New exploration | URL hash with a Url64-encoded seed, built in `mathesar_ui/src/systems/data-explorer/urlSerializationUtils.ts` and consumed once by the Data Explorer route component. |

## From route params to stores and contexts

Each route component turns its params into state, then renders children only when the entity exists.

| Route component | What it sets | Not found behavior |
|---|---|---|
| `mathesar_ui/src/routes/DatabaseRoute.svelte` | `databasesStore.setCurrentDatabaseId(id)`. Builds `CollaborationFeaturesContext` and `DatabaseRouteContext`. Clears the id on unmount. | `ErrorPage` with `database_not_found` |
| `mathesar_ui/src/routes/DatabaseSettingsRoute.svelte` | `DatabaseSettingsRouteContext.construct(...)` | |
| `mathesar_ui/src/routes/SchemaRoute.svelte` | `$currentSchemaId = schemaId` from `mathesar_ui/src/stores/schemas.ts`. Builds `SchemaRouteContext`. Clears on unmount. | `ErrorPage` with `schema_not_found` |
| `mathesar_ui/src/routes/TableRoute.svelte` | `$currentTableId = tableId` from `mathesar_ui/src/stores/tables.ts`. Passes the `Table` model as a prop. | `ErrorPage` with `table_not_found` |
| `mathesar_ui/src/routes/RecordPageRoute.svelte` | `new RecordStore({ table, recordPk })` | handled inside the record view |
| `mathesar_ui/src/routes/DataExplorerRoute.svelte` | A `QueryManager`, rebuilt when `queryId` changes | `ErrorPage` with `exploration_not_found` |
| `mathesar_ui/src/routes/DataFormRoute.svelte` | Runs `dataFormsFetch.runConservatively()`. Builds `DataFormRouteContext`. | `ErrorPage` with `page_doesnt_exist` |
| `mathesar_ui/src/routes/UsersRoute.svelte` | `setUsersStoreInContext()` | |

- Setting the current database id triggers the schema store to load. Setting the current schema id triggers the tables and explorations stores to load. The chain is described in `.agents/docs/03-frontend/state-stores.md`.
- Route contexts are classes in `mathesar_ui/src/contexts/` with static `construct(...)` and `get()` methods. They use `setRouteContext` from `mathesar_ui/src/contexts/utils.ts`, which reuses one writable store per context key. Descendants read them as stores: `const ctx = DatabaseRouteContext.get(); $: ({ database } = $ctx);`.
- Each route component adds its breadcrumb with `mathesar_ui/src/components/breadcrumb/AppendBreadcrumb.svelte`. The item is removed when the route unmounts.
- Pages set the document title with `makeSimplePageTitle` from `mathesar_ui/src/pages/pageTitleUtils.ts` inside `<svelte:head>`.
- Pages wrap content in `mathesar_ui/src/layouts/LayoutWithHeader.svelte`. It hides the header for anonymous visitors. Sheet pages pass `fitViewport`.

## Auth and permission gating

Gating in the client only hides UI. The backend enforces access in each RPC method (see `.agents/docs/02-backend/rpc.md`).

| Layer | Check | Location |
|---|---|---|
| Django | `login_required` on every app view except `home` (which redirects) and `anonymous_route_home` | `mathesar/views/__init__.py` |
| Root | `commonData.is_authenticated` selects `AuthenticatedRoutes`. Logged-out visitors on `/` go to `/auth/login/?next=/`. | `mathesar_ui/src/routes/RootRoute.svelte` |
| Admin pages | `/administration/*` routes exist only when `userProfile.isMathesarAdmin` is true. Others get the fallback error page. | `mathesar_ui/src/routes/AuthenticatedRoutes.svelte` |
| Database settings | `canViewDbPermissionsAndSettings()` is true for superusers, or for everyone when `per_user_databases_enabled` is false. Otherwise `/settings/*` redirects to `schemas/`. | `mathesar_ui/src/utils/preloadData.ts`, `mathesar_ui/src/routes/DatabaseRoute.svelte` |
| Table page | Shows a warning instead of the sheet when the current role lacks `SELECT`. | `mathesar_ui/src/pages/table/TablePage.svelte` |
| Object actions | Buttons check `currentAccess.currentRolePrivileges` and `currentRoleOwns` on `Schema` and `Table` models, and `canInsertRecords`, `canUpdateRecords`, `canDeleteRecords` on `TabularData`. | `mathesar_ui/src/models/internal/ObjectCurrentAccess.ts`, `mathesar_ui/src/stores/table-data/tabularData.ts` |

The current user is a `UserModel` in a context store. Read it with `getUserProfileStoreFromContext()` from `mathesar_ui/src/stores/userProfile.ts`.

## Anonymous shared form

The public form page is the only screen that works without login.

1. Django view `anonymous_route_home` serves `shares/forms/<token>`. It ensures a CSRF cookie and a session. It has no `login_required`.
2. For a logged-out visitor, `get_anonymous_common_data` returns only the base keys with `routing_context: 'anonymous'`.
3. `mathesar_ui/src/App.svelte` uses language `en` because there is no user. `mathesar_ui/src/AppContext.svelte` installs `AnonymousViewerUserModel`. The entity stores start empty.
4. `mathesar_ui/src/routes/RootRoute.svelte` always mounts the `/shares/*` branch, for logged-in and logged-out visitors.
5. `mathesar_ui/src/routes/SharedFormRoute.svelte` batches `api.forms.get` and `api.forms.get_source_info` with the token. It renders the fill page only when `publish_public` is true.
6. The form submits with `api.forms.submit`. File fields upload to `/files/` with `form_token` and `form_field_key` query parameters (`mathesar_ui/src/api/rest/fileAttachments.ts`).

The RPC methods `forms.get`, `forms.get_source_info`, `forms.list_related_records` and `forms.submit` are declared with `auth="anonymous"` in `mathesar/rpc/forms.py`.
Code that runs on this page must not assume `commonData.user`, `databases` or other authenticated keys exist. Narrow on `routing_context` first.

## Recipe: add a page

1. Add a URL builder to `mathesar_ui/src/routes/urls.ts`.
2. Create the page component in a folder under `mathesar_ui/src/pages/`. Wrap it in `LayoutWithHeader` and set the title.
3. Add a `<Route>` in the right route component. Under a `firstmatch` parent, order matters. Add an `AppendBreadcrumb`.
4. If the URL is not covered by an existing Django pattern, add one in `mathesar/urls.py` that points to an existing shell view.
5. Add UI strings to `mathesar_ui/src/i18n/languages/en/dict.json`.
6. Gate the route in the client if needed, and confirm the RPC methods it calls enforce the same rule.
