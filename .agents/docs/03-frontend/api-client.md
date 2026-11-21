# API client

This file explains how the client talks to the backend: the typed JSON-RPC bindings, the builder package behind them, batching, cancellation, error handling, the few remaining plain HTTP endpoints, and how to add a binding for a new RPC method.
Read it before calling the backend from new code or after changing an RPC signature in Python.

## Where things are

| Path | Content |
|---|---|
| `mathesar_ui/src/api/rpc/index.ts` | Builds and exports `api`, the whole method tree. Endpoint `/api/rpc/v0/`. Sends the `X-CSRFToken` header from the `csrftoken` cookie. |
| `mathesar_ui/src/api/rpc/` | One file per backend namespace, named after it: `analytics`, `collaborators`, `columns`, `constraints`, `data_modeling`, `databases`, `explorations`, `forms`, `records`, `roles`, `schemas`, `servers`, `tables`, `users`. Each exports the request and response types and one object of method declarations. |
| `mathesar_ui/src/api/rpc/_common/columnDisplayOptions.ts`, `mathesar_ui/src/api/rpc/_common/commonTypes.ts` | Types shared by several namespaces: column display options and record summary lists. |
| `mathesar_ui/src/packages/json-rpc-client-builder/` | The generic client: `buildRpcApi`, `rpcMethodTypeContainer`, `RpcRequest`, `RpcError`, `batchSend`, `batchRun`, `runner`. `mathesar_ui/src/packages/json-rpc-client-builder/README.md` shows usage. `mathesar_ui/src/packages/json-rpc-client-builder/INTERNALS.md` explains the typing trick. |
| `mathesar_ui/src/api/rest/` | Non-RPC endpoints and older helpers. See "What remains under rest". |
| `mathesar_ui/src/3rd-party-apis/github-releases.ts` | GitHub releases lookup for the update page. |

The backend side (decorator, auth levels, error codes) is described in `.agents/docs/02-backend/rpc.md`.

## Declaring a method

A method is one property in a namespace object. Its value is `rpcMethodTypeContainer<Params, Result>()`. The property path is the RPC method name.

```ts
// mathesar_ui/src/api/rpc/schemas.ts
export const schemas = {
  list: rpcMethodTypeContainer<{ database_id: number }, RawSchema[]>(),
  privileges: {
    list_direct: rpcMethodTypeContainer<
      { database_id: RawDatabase['id']; schema_oid: RawSchema['oid'] },
      Array<RawSchemaPrivilegesForRole>
    >(),
  },
};
```

- `api.schemas.privileges.list_direct(...)` sends method `schemas.privileges.list_direct`. This must equal the `name=` argument of `@mathesar_rpc_method` in Python.
- `rpcMethodTypeContainer` returns an empty array at runtime. It only carries types. `buildRpcApi` replaces it with a function that returns an `RpcRequest`.
- Parameters are sent as a JSON object. Keys must match the Python keyword argument names exactly (snake case).
- There is no code generation and no runtime validation. The TypeScript types are written by hand from the Python signatures and can drift.

## Calling a method

`api.x.y(params)` only builds an `RpcRequest`. Nothing is sent until you call one of these:

| Call | Returns | On failure |
|---|---|---|
| `request.run()` | `CancellablePromise<Result>` | Rejects with an `RpcError`. This is the usual form (over 100 call sites). |
| `request.send()` | `CancellablePromise<RpcResponse<Result>>` | Never rejects. Check `response.status === 'ok'` then read `response.value`. Otherwise the response is the `RpcError`. |
| `batchRun([reqA, reqB])` | Promise of a tuple of results, typed per request | Rejects with the first `RpcError` found. |
| `batchSend([reqA, reqB])` | Promise of a tuple of `RpcResponse` | Never rejects. Per-request error handling. |
| `runner(api.x.y)` | A function `(params) => CancellablePromise<Result>` | Same as `run`. Useful as the function argument of `AsyncStore`. |
| `new AsyncRpcApiStore(api.x.y, options)` | A store with loading, value and error | Error in the store value. See `.agents/docs/03-frontend/state-stores.md`. |

```ts
import { api } from '@mathesar/api/rpc';
import { batchRun } from '@mathesar/packages/json-rpc-client-builder';

const rawSchemas = await api.schemas.list({ database_id: 1 }).run();

const [columns, constraints] = await batchRun([
  api.columns.list_with_metadata({ database_id: 1, table_oid: 123 }),
  api.constraints.list({ database_id: 1, table_oid: 123 }),
]);
```

Wire format, from `mathesar_ui/src/packages/json-rpc-client-builder/requests.ts`:

- Single call: `POST /api/rpc/v0/` with body `{ jsonrpc: '2.0', id: 0, method, params }`.
- Batch: one `POST` with an array of such bodies. Ids are the array indices. Responses are matched back by id, so the result order equals the request order.
- All requests in a batch must target the same endpoint. The headers of the first request are used.
- A batch is not a transaction. Each call succeeds or fails on its own. `RecordsData.bulkUpdate` relies on this and handles each row's response separately.
- The backend runs the calls of a batch one after another in array order (django-modern-rpc). Do not write code that depends on it.

## Cancellation

- `run`, `send`, `batchRun` and `batchSend` return a `CancellablePromise` (`mathesar_ui/src/component-library/common/utils/CancellablePromise.ts`). `cancel()` aborts the `fetch` through an `AbortController`.
- After `cancel()`, the promise's callbacks are not invoked. Code after `await` does not resume.
- The common pattern keeps the last promise in a field and cancels it before starting the next: `this.promise?.cancel(); this.promise = api.x.y(...).run();`. `AsyncStore.run` does this for you.
- Cancelling aborts the HTTP request only. The Django view that already started keeps running.
- `promise.transformResolved(fn)` maps the result and keeps the promise cancellable. A plain `.then()` is typed as `Promise`, so the cancel handle is lost.

## Errors

`RpcError` (`mathesar_ui/src/packages/json-rpc-client-builder/RpcError.ts`) extends `Error` with `code: number`, `message`, optional `data`, and `status: 'error'`.

- A JSON-RPC error object in the response becomes an `RpcError` with the backend's `code` and `message`.
- A network failure becomes an `RpcError` with code `0`.
- `RpcError.fromAnything(value)` converts any caught value. Use it when a store's error type is `RpcError`.
- `getErrorMessage(e)` in `mathesar_ui/src/utils/errors.ts` extracts a display string from anything.
- `mathesar_ui/src/components/errors/errorUtils.ts` maps two backend codes to custom components: `-28030` (no connection available) and `-30193` (psycopg operational error). Add code-specific UI there.
- RPC calls do not handle an expired session. The old XHR helper reloads the page on HTTP 401. The RPC client does not.
- If the server answers with a body that is not JSON (for example an HTML error page), `send` neither resolves nor rejects. The `response.json()` rejection is not handled in `mathesar_ui/src/packages/json-rpc-client-builder/requests.ts`.

Standard handling in a component:

```ts
try {
  await api.records
    .delete({ database_id, table_oid, record_ids: [recordPk] })
    .run();
  toast.success($_('record_deleted_successfully'));
} catch (e) {
  toast.error(getErrorMessage(e));
}
```

## What remains under rest

All data access goes through RPC. The plain HTTP endpoints below are declared in `mathesar/urls.py`. They carry multipart uploads or file downloads.

| Client file | Endpoint | Use |
|---|---|---|
| `mathesar_ui/src/api/rest/dataFiles.ts` | `/api/db/v0/data_files/` (POST upload or pasted text, GET and PATCH by id) | Upload a CSV or TSV for import. The returned id is then passed to `api.tables.import`. |
| `mathesar_ui/src/api/rest/bulkInsert.ts` | `/bulk_insert/` | Import a file into an existing table with a column mapping. |
| `mathesar_ui/src/api/rest/fileAttachments.ts` | `/files/` | Upload a file for a file-type cell or a public form field. |
| links in `mathesar_ui/src/systems/table-view/table-inspector/table/TableActions.svelte` and `mathesar_ui/src/systems/data-explorer/action-pane/ActionsPane.svelte` | `/api/export/v0/tables/`, `/api/export/v0/explorations/` | CSV export as a normal browser download. |

Helpers in `mathesar_ui/src/api/rest/utils/`:

| File | Still used for |
|---|---|
| `mathesar_ui/src/api/rest/utils/requestUtils.ts` | `uploadFile` (XHR with progress callback), `getAPI`, `postAPI`, `patchAPI` for data files, `getExternalApi` for GitHub. Also the types `RequestStatus` and `States`. This file is imported by 37 files across the app. |
| `mathesar_ui/src/api/rest/utils/errors.ts` | `ApiError`, `ApiMultiError`, `extractDetailedFieldBasedErrors`. Written for the old REST error format. Still imported by the Data Explorer runner, the record page and the user form. |
| `mathesar_ui/src/api/rest/utils/recordUtils.ts` | `getDetailedRecordsErrors`, same origin. |
| `mathesar_ui/src/api/rest/utils/errorCodes.ts` | One constant used by the Data Explorer error view. |

Do not add new data endpoints here. `RequestStatus` is the app-wide request state type in spite of its location. Import it from there.

## Recipe: bind a new backend RPC method

1. Read the Python function under `mathesar/rpc/`. Note the `name=` value, the keyword parameters, the return annotation, and the `auth` level.
2. Open the matching file in `mathesar_ui/src/api/rpc/`. The first segment of the method name is the file and exported object. Further segments are nested objects.
3. Add or reuse exported interfaces for the parameter and result shapes. Name raw API shapes `Raw...` (`RawSchema`, `RawTable`). Derive field types from existing ones where possible (`RawDatabase['id']`).
4. Add the property: `my_method: rpcMethodTypeContainer<ParamsType, ResultType>()`. Use `void` for methods that return nothing.
5. For a new namespace, create the file and add the object to `methodTree` in `mathesar_ui/src/api/rpc/index.ts`.
6. Call it with `.run()` from a store, model method or route context. Prefer a method on the model in `mathesar_ui/src/models/` when it acts on one entity. Prefer `AsyncRpcApiStore` for data that a panel loads and shows.
7. After a mutation, update the affected store by hand. Nothing refetches automatically.
8. Run `npm run typecheck` and `npm run lint` in `mathesar_ui/`.
9. Exercise the call against a running backend. Types alone prove nothing about the wire shape. See `.agents/docs/01-setup/drive-the-app.md`.

When a Python signature changes, grep the method path (for example `tables.metadata.set` appears as `api.tables.metadata.set`) to find every call site.

## Mapping Python types to TypeScript

| Python (in `mathesar/rpc/`) | TypeScript (in `mathesar_ui/src/api/rpc/`) |
|---|---|
| `TypedDict` class | `export interface` |
| `TypedDict` with `total=False` | interface with optional fields |
| `int`, `float` | `number` |
| `str` | `string` |
| `bool` | `boolean` |
| `Optional[X]` in a result | `X \| null` |
| keyword parameter with a default | optional key `x?: X` |
| `list[X]` | `X[]` |
| `dict[str, X]`, and dicts keyed by attnum or oid | `Record<string, X>`. JSON object keys are always strings. |
| `Literal['a', 'b']` | union of string literals, often derived from an `as const` array such as `allSchemaPrivileges` |
| `Any` | `unknown` |
| no return value | `void` |

Examples of pairs: `SchemaInfo` in `mathesar/rpc/schemas/base.py` and `RawSchema` in `mathesar_ui/src/api/rpc/schemas.ts`. `ColumnInfo` in `mathesar/rpc/columns/base.py` and `RawColumnWithMetadata` in `mathesar_ui/src/api/rpc/columns.ts`. `RecordList` in `mathesar/rpc/records.py` and `RecordsResponse` in `mathesar_ui/src/api/rpc/records.ts`.

Known differences between the two sides:

- Names differ. Search by method name, not by type name.
- Field names stay in snake case in TypeScript. Do not convert them.
- Nullability can disagree. `ColumnInfo.type_options` and `ColumnInfo.default` are not `Optional` in Python, while the TS column type declares both as nullable. Check the code that builds the value.
- TS parameter types can be narrower than Python. `schemas.add` accepts `owner_oid` in Python and the TS binding does not declare it.
- Record objects use stringified column attnums as keys (`Result` in `mathesar_ui/src/api/rpc/records.ts`). Column ids in `RawColumnWithMetadata.id` are numbers.

## Coverage

Counted by script on this checkout: the backend registers 103 methods with `@mathesar_rpc_method`, and the client declares 98.
The five without a client binding are `analytics.view_report`, `columns.metadata.list`, `columns.reset_mash`, `databases.delete` and `schemas.get`.
Every client declaration has a backend method. The frontend has no test for the bindings.
