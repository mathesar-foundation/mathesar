# State and stores

This file describes how the client holds state: the store patterns in use, the stores in `mathesar_ui/src/stores/`, the table data stores behind every sheet, the model classes, and how saves and errors reach the screen.
Read it before changing data loading, adding shared state, or touching the table view.

`mathesar_ui/ARCHITECTURE.md` explains the three class-and-store patterns (immutable class in a store, class holding stores, nested stores) and when to pass stores by props, context or import. This file does not repeat that. It lists what exists and how the pieces connect.

## Patterns in use

| Pattern | Shape | Examples |
|---|---|---|
| Module singleton | A store created at module load and imported directly. The entity stores are seeded from the preloaded page data. | `databasesStore`, `schemas`, `currentTablesData`, `queries`, `toast`, `modal` |
| Context store | `setXInContext()` in an ancestor, `getXFromContext()` in descendants. Scoped to a subtree. | `mathesar_ui/src/stores/userProfile.ts`, `mathesar_ui/src/stores/users.ts`, `setTabularDataStoreInContext` |
| Route context class | A class per route level, held in a writable store in context, with `construct()` and `get()` statics. Owns async stores for that level. | `mathesar_ui/src/contexts/DatabaseRouteContext.ts`, `mathesar_ui/src/contexts/SchemaRouteContext.ts` |
| Controller in context | A plain class with stores and imperative methods. Created in `mathesar_ui/src/AppContext.svelte` and shared with `makeContext()`. | `RecordSelectorController`, `AttachableRowSeekerController`, `LightboxController` |
| Async store | `AsyncStore` and `AsyncRpcApiStore`: one request, one store with loading, value and error. | privileges, roles, collaborators, data forms |
| Model with stores | A class for one API entity. Mutable fields are readable stores with private writers. | `mathesar_ui/src/models/Schema.ts` |
| Immutable value in a writable | `store.update((v) => v.withX(...))`. | `Filtering`, `Sorting`, `Grouping`, `Pagination`, `SheetSelection` |

Two request-state types coexist. `RequestStatus` (`{ state: 'processing' | 'success' | 'failure', errors }`) is current. The enum `States` is marked deprecated but `RecordsData` and `ConstraintsDataStore` still use it. Both live in `mathesar_ui/src/api/rest/utils/requestUtils.ts`.

Store helpers in `mathesar_ui/src/component-library/common/utils/`: `WritableMap` and `WritableSet` (stores with map and set methods), `ImmutableMap` and `ImmutableSet`, `collapse` (flattens a store of a store), `unite` (array of stores to store of array), `reactiveSort`, `EventHandler` (typed `on` and `dispatch`), `makeContext`.

## AsyncStore and AsyncRpcApiStore

`mathesar_ui/src/stores/AsyncStore.ts` wraps a function that returns a promise.

- The store value is an `AsyncStoreValue` with `isLoading`, `resolvedValue`, `error`, `isOk`, `hasSettled`, `isInitializing`, `isReloading`.
- `run(props)` starts the request and cancels the previous one. Only a `CancellablePromise` can be cancelled. With a plain promise the earlier request keeps running, and if it settles last it overwrites the newer value. `run` does not throw when the request fails. Read the error from the value.
- `runConservatively(props)` runs only if the store has never run.
- `updateResolvedValue(fn)` edits the cached value after a mutation. Route contexts use it to add or remove one item without refetching.
- `reset()` and `cancel()` exist. `getValueOnceResolved()` waits for a running request.

`mathesar_ui/src/stores/AsyncRpcApiStore.ts` specializes it for one RPC method.

```ts
const roles = new AsyncRpcApiStore(api.roles.list, {
  staticProps: { database_id: database.id },
  postProcess: (rawRoles) => new ImmutableMap(rawRoles.map((r) => [r.oid, r])),
});
void roles.run();
```

- Errors are always `RpcError`.
- `staticProps` fixes some parameters. `run` then takes only the rest.
- `AsyncRpcApiStore.runBatch([a.batchRunner(props), b.batchRunner(props)])` sends several stores in one HTTP request. `runBatchConservatively` skips stores that already ran.
- The models expose factories that return these stores, for example `Database.constructRolesStore()` and `Schema.constructDataFormsStore()`.

## Stores in `mathesar_ui/src/stores/`

| File | What it holds |
|---|---|
| `mathesar_ui/src/stores/databases.ts` | `databasesStore`: all `Database` models, `currentDatabase`, connect, create, disconnect, `refresh`. |
| `mathesar_ui/src/stores/schemas.ts` | `schemas` for the current database, `currentSchemaId`, `currentSchema`, `sortedSchemas`, `createSchema`, `deleteSchema`. |
| `mathesar_ui/src/stores/tables.ts` | Tables per database and schema. `currentTablesData`, `currentTableId`, `currentTable`, `createTable`, `updateTable`, `deleteTable`, `createTableFromDataFile`, `getTableFromStoreOrApi`. |
| `mathesar_ui/src/stores/queries.ts` | Saved explorations of the current schema: `queries`, `addExploration`, `replaceExploration`, `getExploration`, `deleteExploration`. |
| `mathesar_ui/src/stores/users.ts` | `UserModel`, `AnonymousViewerUserModel`, and the admin user list store in context. |
| `mathesar_ui/src/stores/userProfile.ts` | The logged-in user as a context store. |
| `mathesar_ui/src/stores/releases.ts` | Current and latest release from GitHub, cached in localStorage for one day. Set only for admins. |
| `mathesar_ui/src/stores/toast.ts` | The `toast` singleton. |
| `mathesar_ui/src/stores/modal.ts` | The `modal` singleton (`ModalMultiplexer`). |
| `mathesar_ui/src/stores/confirmation.ts` | `confirm`, `confirmDelete`, `confirmationController`. |
| `mathesar_ui/src/stores/clipboard.ts` | Context store for the active copy and paste handler. |
| `mathesar_ui/src/stores/localStorage.ts` | `LOCAL_STORAGE_KEYS` and one `LocalStorageStore` per persisted UI preference (inspector visibility and widths, theme). |
| `mathesar_ui/src/stores/LocalStorageStore.ts` | Writable store mirrored to `localStorage`. |
| `mathesar_ui/src/stores/AsyncStore.ts`, `mathesar_ui/src/stores/AsyncRpcApiStore.ts` | See above. |
| `mathesar_ui/src/stores/AssociatedCellData.ts` | Per-column lookup data for cells (record summaries, file manifests). Merges fetched values with values added after single-cell edits. |
| `mathesar_ui/src/stores/PreventableEffectsStore.ts` | Writable with named side effects that a caller can skip per update. Used by the sheet selection store. |
| `mathesar_ui/src/stores/abstract-types/` | Static map from PostgreSQL types to Mathesar UI types. See `.agents/docs/03-frontend/components.md`. |
| `mathesar_ui/src/stores/table-data/` | State of one table sheet. See below. |

The "current entity" chain:

1. `mathesar_ui/src/routes/DatabaseRoute.svelte` calls `databasesStore.setCurrentDatabaseId(id)`.
2. `schemas` derives from `currentDatabase`. On a database change it uses the preloaded schemas once, otherwise it calls `api.schemas.list`.
3. `mathesar_ui/src/routes/SchemaRoute.svelte` sets `currentSchemaId`. `currentSchema` derives from it.
4. `currentTablesData` and `queries` derive from `currentSchema`. They use preloaded data once, otherwise they fetch.

Consequences:

- These stores fetch as a side effect of being subscribed to. Reading them with `get()` outside a component can start a request.
- `mathesar_ui/src/stores/tables.ts` and `mathesar_ui/src/stores/queries.ts` carry file comments saying they need refactoring. Follow the newer style (models, route contexts, `AsyncRpcApiStore`) for new state.
- Mutations update the store by hand after the RPC call. `createTable` and `deleteTable` also adjust `schema.tableCount`.

## Table data: `mathesar_ui/src/stores/table-data/`

One `TabularData` instance backs one sheet of one table. It is built in three places: `mathesar_ui/src/pages/table/TablePage.svelte`, `mathesar_ui/src/systems/record-view/TableWidget.svelte` (related records on a record page) and `mathesar_ui/src/systems/record-selector/RecordSelectorWindow.svelte`. Components reach it with `getTabularDataStoreFromContext()`. The context holds a store of the instance, so components write `$: ({ recordsData, meta } = $tabularData);`.

| Part | File | Role |
|---|---|---|
| `TabularData` | `mathesar_ui/src/stores/table-data/tabularData.ts` | Builds and wires the parts. Exposes `processedColumns`, `allColumns`, `displayedColumns`, `selection`, `selectedCellData`, `isLoading`, the `can...Records` permission stores, `refresh()`, `addNewRecord()`, `destroy()`. |
| `Meta` | `mathesar_ui/src/stores/table-data/meta.ts` | View parameters as writables: `pagination`, `sorting`, `grouping`, `filtering`, `joining`, `hiddenColumns`, `searchFuzzy`. Also per-cell and per-row request status maps. Does not depend on other parts. |
| `ColumnsDataStore` | `mathesar_ui/src/stores/table-data/columns.ts` | Fetches `columns.list_with_metadata`. Column mutations: `add`, `rename`, `patch`, `changeType`, `setDisplayOptions`, `deleteColumn`. Emits `columnAdded`, `columnRenamed`, `columnPatched`, `columnDeleted`. |
| `ConstraintsDataStore` | `mathesar_ui/src/stores/table-data/constraints.ts` | Fetches `constraints.list`. `add`, `remove`, `setUniquenessOfColumn`, `uniqueColumns`. Emits `constraintAdded`, `constraintRemoved`. |
| `RecordsData` | `mathesar_ui/src/stores/table-data/records.ts` | Fetches and mutates rows. Holds `fetchedRecordRows`, `newRecords`, `selectableRowsMap`, `grouping`, `totalCount`, `linkedRecordSummaries`, `joinedRecordSummaries`, `fileManifests`. |
| `ProcessedColumn` | `mathesar_ui/src/stores/table-data/processedColumns.ts` | Immutable per-column bundle: raw column, constraints, abstract type, cell and input components, allowed filters, formatter, `isEditable`. Rebuilt when columns or constraints change. |
| `SimpleManyToManyJoinedColumn` | `mathesar_ui/src/stores/table-data/joinedColumns.ts` | Virtual columns for many-to-many joins chosen in `Meta.joining`. |
| `Display` | `mathesar_ui/src/stores/table-data/display.ts` | Turns rows into `displayRowDescriptors`: group headers, fetched rows, a help row, new rows, and one placeholder row. Holds scroll offsets. |
| Row classes | `mathesar_ui/src/stores/table-data/Row.ts` | `PersistedRecordRow`, `DraftRecordRow`, `PlaceholderRecordRow`, `GroupHeaderRow`, `HelpTextRow`, and type guards. |
| `Filtering`, `Sorting`, `Grouping`, `Joining`, `HiddenColumns`, `SearchFuzzy` | `mathesar_ui/src/stores/table-data/filtering.ts`, `mathesar_ui/src/stores/table-data/sorting.ts`, `mathesar_ui/src/stores/table-data/grouping.ts`, `mathesar_ui/src/stores/table-data/joining.ts`, `mathesar_ui/src/stores/table-data/hiddenColumns.ts`, `mathesar_ui/src/stores/table-data/searchFuzzy.ts` | Immutable values. Each has `recordsRequestParams()` or equivalent, and `terse()` with `fromTerse()` for serialization. |
| `TableStructure` | `mathesar_ui/src/stores/table-data/TableStructure.ts` | Read-only columns, constraints and links of a table without rows. One batched request. Used by the record page, forms and pickers. |
| helpers | `mathesar_ui/src/stores/table-data/utils.ts`, `mathesar_ui/src/stores/table-data/constraintsUtils.ts`, `mathesar_ui/src/stores/table-data/record-summaries/recordSummaryUtils.ts` | Cell keys, row status computation, validation, grouping conversion. |

Selection lives outside this folder. `TabularData.selection` is a `SheetSelectionStore` from `mathesar_ui/src/components/sheet/selection/`. It holds an immutable `SheetSelection` over a `Plane` of row ids and column ids derived from `selectableRowsMap` and `displayedColumns`.

How the parts react:

- `RecordsData` subscribes to `meta.recordsRequestParamsData`. Any change to pagination, sorting, grouping, filtering, fuzzy search or joining refetches rows.
- A filter or fuzzy search change resets pagination to page 1.
- Grouping adds an ascending sort on the grouped columns in the request (`Sorting.recordsRequestParamsIncludingGrouping`).
- `TabularData` listens to column and constraint events. Rename refreshes everything. Add and patch refetch rows. Delete removes the column from sorting, grouping, filtering and hidden columns.
- `Filtering` stores the UI filter tree and converts it to the API `SqlExpr` type. Filter entries with empty values are left out of the request.

Ids:

- Column ids in `ProcessedColumn.id`, `Meta` and record objects are attnums as strings. `RawColumnWithMetadata.id` is a number. Convert with `castColumnIdToNumber` from `mathesar_ui/src/utils/columnUtils.ts`.
- Rows are identified by `row.identifier`, a generated unique id, not by primary key. Cell selection ids and cell status keys are different strings. Read `mathesar_ui/src/stores/table-data/records.ts.README.md` before touching them. Its 2025-03 note at the top overrides the older sections below it.

### Persistence to the URL

Only the table page persists view state.

1. `Meta.serialization` is a derived store: Url64 of the JSON of `[pagination, sorting, grouping, filtering, joining, hiddenColumns]` in terse form. It is `''` when everything is default.
2. `mathesar_ui/src/pages/table/TablePage.svelte` writes it with `router.location.query.set('q', value)`. tinro replaces the history entry for this call, so view changes add no back-button steps.
3. The same component reads `q` from `$router` and builds `Meta.fromSerialization(...)` and a new `TabularData` in reactive statements.
4. The component both writes `q` and derives `Meta` and `TabularData` from `q`. When you change this code, watch the network tab: a rebuilt `TabularData` sends the columns, constraints, records and joinable tables requests again.
5. A serialization that fails to parse yields default `Meta`.

Adding a field to `Meta` that must survive reload means: add a terse form, extend `TerseMetaProps`, `makeMetaProps`, `makeTerseMetaProps` and the `serialization` store. The tuple is positional, so append at the end. Old links do not have the new element, so its `fromTerse` must accept `undefined` and return the default. If it throws, `deserializeMetaProps` catches the error and the whole saved view falls back to defaults.

`searchFuzzy`, selection, scroll position and request statuses are not serialized. Widget and record selector sheets keep `Meta` in memory only.

## Models

Classes in `mathesar_ui/src/models/` wrap raw API objects and keep parent links (`table.schema.database`).

| Model | Notes |
|---|---|
| `Database` | Plain fields. Factories for async stores (roles, configured roles, collaborators, privileges, underlying database, current role). `addRole`, `addCollaborator`. |
| `Schema` | `name`, `description`, `tableCount` are readable stores. `updateNameAndDescription`, `updateOwner`, `delete`, `addDataForm`. `currentAccess` holds privileges. |
| `Table` | Plain fields (`oid`, `name`, `description`, `metadata`, `type`). Replaced as a whole in `mathesar_ui/src/stores/tables.ts` after updates. `currentAccess`, `updateOwner`. |
| `Role`, `ConfiguredRole`, `Collaborator`, `Server`, `UnderlyingDatabase`, `DataForm` | Same idea for their entities. |
| `ObjectCurrentAccess` | `mathesar_ui/src/models/internal/ObjectCurrentAccess.ts`: `ownerOid`, `currentRolePrivileges`, `currentRoleOwns` as stores. |

Model methods call the API and update the model's own stores. They do not update lists that contain the model. The caller (a store function or a route context) does that.

## Saving and optimistic updates

Most of the app is not optimistic: await the RPC call, then update the store, then show a toast. The sheet is the exception.

Cell edits (`RecordsData.bulkUpdate` and `bulkDml` in `mathesar_ui/src/stores/table-data/records.ts`):

1. The new values are written into the row objects before any request.
2. Each touched cell gets `{ state: 'processing' }` in `meta.cellModificationStatus`. New rows get the same in `meta.rowCreationStatus`.
3. All rows go in one batched request: `records.add` for draft rows, `records.patch` for persisted rows.
4. On success the row takes the server's values, except for cells that have a newer request in flight.
5. On failure the edited value stays visible and every edited cell of that row gets `{ state: 'failure', errors }`. There is no rollback.
6. `fetch()` clears all statuses unless called with `clearMetaStatuses: false`.

Other row operations: `addEmptyRecord` and `duplicateRecord` append a `DraftRecordRow` to `newRecords` and call `records.add`. New rows stay in the "new records" block below the page until the next fetch. `deleteSelected` deletes, refetches, and throws an `Error` with a combined message if any row failed.

## Showing errors

| Situation | Mechanism |
|---|---|
| Sheet cell or row failed | `meta.rowStatus` and `meta.cellModificationStatus` drive cell backgrounds and the error popover in `mathesar_ui/src/systems/table-view/row/`. |
| Action from a button or menu | `try { await ...run(); toast.success(...) } catch (e) { toast.error(getErrorMessage(e)) }` or `toast.fromError(e)`. `getErrorMessage` is in `mathesar_ui/src/utils/errors.ts`. |
| Form submit | `mathesar_ui/src/components/form/FormSubmit.svelte`. With the `catchErrors` prop it stores the failure in `form.requestStatus` and renders it below the buttons. Without it, the `onProceed` callback must catch and show the error itself. |
| Page or panel load failed | `mathesar_ui/src/components/errors/Errors.svelte` with an array of `RpcError` or strings. `mathesar_ui/src/components/errors/errorUtils.ts` maps some RPC error codes to custom messages. |
| Destructive action | `confirmDelete` from `mathesar_ui/src/stores/confirmation.ts`. Its `onError` shows a toast. |

## Gotchas

- `mathesar_ui/svelte.config.cjs` enables `immutable`. Mutating a `Map`, array or object held in a store or prop does not re-render. Create a new value.
- `CancellablePromise.then` in `mathesar_ui/src/component-library/common/utils/CancellablePromise.ts` invokes neither callback once the promise is cancelled. Code after `await` on a cancelled promise does not resume, and `finally` blocks after it do not run. Do not rely on cleanup after an await that can be cancelled.
- The table data stores start fetching in their constructors. Creating a `TabularData` sends separate requests for columns, constraints, records and joinable tables.
- Call `destroy()` on stores that have it when you own their lifetime.
- `databasesStore`, `schemas`, `currentTablesData` and `queries` read preloaded data at import. See `.agents/docs/03-frontend/testing-lint.md` for the effect on tests.
