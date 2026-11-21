# RPC layer

How JSON-RPC methods are declared, registered, authorized, documented, and tested, plus a recipe for adding or changing one.
Read this before touching anything in `mathesar/rpc/`.
User-facing request and response format is in `docs/docs/api/index.md` and is not repeated here.

## Basics

- Library: `django-modern-rpc` (package `modernrpc`), pinned in `requirements.txt`.
- One endpoint: `POST /api/rpc/v0/`, routed in `mathesar/urls.py` to `MathesarRPCEntryPoint` in `mathesar/views/__init__.py`.
- The endpoint is CSRF-exempt (the library decorates its view). Authentication is the Django session cookie or HTTP Basic auth.
- Batch requests (a JSON array of calls) work. `api_tests/test_happy_db_setups.py` uses one.
- Every RPC response has HTTP status 200. Failures are JSON-RPC error objects.
- The same view also accepts XML-RPC, because the library default handler list is not overridden. Nothing in the repo uses it.

List every method with its auth level:

```
grep -rn "@mathesar_rpc_method" mathesar/rpc/
```

At runtime, the built-in method `system.listMethods` returns the registered names. Call any method on a running instance with `agents/bin/rpc <method> '<json params>'` (see `agents/docs/01-setup/drive-the-app.md`).

## Declaring a method

Pattern, condensed from `delete` in `mathesar/rpc/records.py`:

```python
@mathesar_rpc_method(name="records.delete", auth="login")
def delete(*, record_ids: list[Any], table_oid: int, database_id: int, **kwargs) -> list[Any]:
    """Docstring in Google style: summary, Args:, Returns:."""
    user = kwargs.get(REQUEST_KEY).user
    with connect(database_id, user) as conn:
        return delete_records_from_table(conn, record_ids, table_oid)
```

Conventions:

- The exposed name is the `name` argument, a dotted path. It is independent of the module path and the Python function name.
- Python names that clash with builtins get a trailing underscore: `list_`, `set_`, `import_`. Docstrings then say "Exposed as `list`".
- All parameters are keyword-only (`*`). Clients must send named `params`.
- `**kwargs` is required to receive the request. The library injects `request` only when the function accepts `**kwargs`. `REQUEST_KEY` is the string `"request"`.
- `database_id` is the Django id of a `Database` row. `table_oid`, `schema_oid`, and similar are Postgres OIDs. Column ids are attnums.
- RPC functions hold no SQL. They call wrappers in `db/` (see `agents/docs/02-backend/db-python.md`) or helpers in `mathesar/utils/`.
- A test forbids calling `exec_msar_func` from anywhere under `mathesar/`.
- Methods acting for the logged-in user open the user database connection with `connect` from `mathesar/rpc/utils.py`, inside a `with` block.

## Registration

- `MODERNRPC_METHODS_MODULES` in `config/settings/common_settings.py` lists the modules to scan.
- At app start the library imports each listed module and registers every module-level function marked by the decorator.
- A new module must be added to that list, or its methods do not exist.
- Package namespaces (`columns`, `databases`, `roles`, `schemas`, `tables`) define methods in a `base` module, for example `mathesar/rpc/columns/base.py`. The package init (`mathesar/rpc/columns/__init__.py`) does `from .base import *` so the package itself can be listed.
- Submodules such as `mathesar/rpc/columns/metadata.py` are listed separately.
- `mathesar/rpc/servers/__init__.py` is empty. Only `mathesar.rpc.servers.configured` is listed.
- Two functions registered under the same name raise `ImproperlyConfigured` at start.

## Auth wrappers

`mathesar_rpc_method` in `mathesar/rpc/decorators.py` takes `auth`:

| `auth` | Who may call | Extra check |
|---|---|---|
| `"superuser"` (default) | Users with `is_superuser` | None |
| `"login"` | Any authenticated user | `ensure_db_authorization`, unless the method name is in `authorization_ignore_list` |
| `"anonymous"` | Anyone | None. The function must do its own checks (see forms). |

- The default is `"superuser"`. Leaving `auth` out makes a method admin-only.
- `ensure_db_authorization` reads `kwargs['database_id']`. A non-superuser must have a `UserDatabaseRoleMap` row for that database, else `NoConnectionAvailable`.
- So every `"login"` method needs a `database_id` parameter, or an entry in `authorization_ignore_list` in the decorator.
- Superusers skip that check. They still need a role mapping for any method that calls `connect`.
- Wrapper order, outermost first: library auth predicate, `maintain_models`, `wire_analytics`, `handle_rpc_exceptions`, `ensure_db_authorization`, the function.
- The auth predicate is only metadata on the function object. The library enforces it for HTTP calls.
- Direct Python calls skip the predicate. `mathesar/views/__init__.py` relies on this to call `users.get` for non-admin users. `ensure_db_authorization` still runs on direct calls.
- A failed predicate returns code `-32603` with message `Authentication failed when calling "<name>"`.

Privilege rules beyond these wrappers are in `agents/docs/02-backend/auth-permissions.md`.

## Exceptions and error codes

- `handle_rpc_exceptions` in `mathesar/rpc/exceptions/handlers.py` catches every exception and raises `modernrpc.exceptions.RPCException(code, message)`.
- `get_error_code` in `mathesar/rpc/exceptions/error_codes.py` picks the code from the exception class module and class name.

| Exception module prefix | Code range | Unknown class |
|---|---|---|
| `builtins` | `-31xxx` | `-31000` |
| `psycopg` | `-30xxx` | `-30000` |
| `django` | `-29xxx` | `-29000` |
| `mathesar` | `-28xxx` | `-28000` |
| `db.` | `-27xxx` | `-27000` |
| `sqlalchemy` | `-26xxx` | `-26000` |
| anything else | `-25xxx` | `-25000` |

- For psycopg errors the message is built from `e.diag`: primary message, detail, hint, constraint, column, table, schema, datatype, SQLSTATE.
- For other errors the message is `ClassName: str(e)`.
- Codes are keyed by class name only. A new exception class gets the "unknown" code of its range until a row is added to the matching map.
- The maps were auto-generated once and contain many names of classes that no longer exist. Do not treat a map entry as proof that a class exists.
- A wrong or missing parameter raises `TypeError` inside the wrappers and returns `-31049`, not the JSON-RPC `-32602`.
- A Django `Model.DoesNotExist` raised from `mathesar/models/` returns `-28009`.
- Postgres permission failures return the psycopg code for `InsufficientPrivilege`. The frontend can match on codes, so do not renumber existing entries.
- The page preload helper `wrap_data_and_rpc_exceptions` in `mathesar/views/__init__.py` converts `RPCException` into `{'state': 'failure', 'error': {...}}`.

## TypedDict conventions

- Parameter and return shapes are `typing.TypedDict` classes in the same module as the methods.
- Usual names: `<Thing>Info` for responses, `Creatable<Thing>Info` or `<Thing>Def` for create input, `Settable<Thing>Info` or `<Thing>Patch` for update input.
- Docstrings use an `Attributes:` section. mkdocstrings renders it.
- Response classes often have a classmethod that copies fields one by one: `from_dict` for JSON from SQL, `from_model` for a Django model.
- Consequence: a new key returned by an SQL function is dropped unless the matching `from_dict` and class body are updated.
- Some methods return the SQL JSON unchanged (for example `schemas.list` in `mathesar/rpc/schemas/base.py`). Check each method.
- Nothing validates these types at runtime. They are documentation and editor hints.
- Methods named `*_with_metadata` merge live database info with Django metadata rows (`columns.list_with_metadata`, `tables.list_with_metadata`, `tables.get_with_metadata`).

## How the API docs are generated

- `docs/mkdocs.yml` enables the `mkdocstrings` plugin with the Python handler. Its search path is `mathesar/rpc/` and its `docstring_style` is `google`.
- `docs/docs/api/methods.md` has one `::: <module>` block per namespace with an explicit `members:` list. Module names are relative to `mathesar/rpc/` (for example `::: columns.metadata`).
- Members are listed by Python name (`list_`), not by exposed name.
- A method or TypedDict that is not listed there does not appear in the published docs. No test checks this list.
- Docs build dependencies are in `docs/requirements.txt`. `docs/README.md` explains previewing.

## Namespaces

| Namespace | Module | Contents |
|---|---|---|
| `analytics` | `mathesar/rpc/analytics.py` | Turn usage reporting on or off, preview a report, send feedback. |
| `collaborators` | `mathesar/rpc/collaborators.py` | Map Mathesar users to a database with a stored role. |
| `columns` | `mathesar/rpc/columns/base.py` | List, add, patch, delete columns. Add a primary key column. Reset file mashes. |
| `columns.metadata` | `mathesar/rpc/columns/metadata.py` | Column display options stored in Django. |
| `constraints` | `mathesar/rpc/constraints.py` | List, add, delete constraints. |
| `data_modeling` | `mathesar/rpc/data_modeling.py` | Foreign key columns, mapping tables, type suggestions, split table, move columns, change primary key. |
| `databases` | `mathesar/rpc/databases/base.py` | Live database info, drop database, `upgrade_sql`. |
| `databases.configured` | `mathesar/rpc/databases/configured.py` | List, patch, disconnect stored database records. |
| `databases.privileges` | `mathesar/rpc/databases/privileges.py` | Database-level privileges and ownership. |
| `databases.setup` | `mathesar/rpc/databases/setup.py` | Create a database on the internal server, or connect an existing one. |
| `explorations` | `mathesar/rpc/explorations.py` | Saved queries: CRUD and `run`. Runs through `db/deprecated/`. |
| `forms` | `mathesar/rpc/forms.py` | Form CRUD, public sharing, anonymous `get` and `submit`. |
| `records` | `mathesar/rpc/records.py` | List, get, add, patch, delete, search records. Record summaries. |
| `roles` | `mathesar/rpc/roles/base.py` | Postgres roles on the server: list, add, delete, membership, current role. |
| `roles.configured` | `mathesar/rpc/roles/configured.py` | Stored role credentials. |
| `schemas` | `mathesar/rpc/schemas/base.py` | List, get, add, patch, delete schemas. |
| `schemas.privileges` | `mathesar/rpc/schemas/privileges.py` | Schema-level privileges and ownership. |
| `servers.configured` | `mathesar/rpc/servers/configured.py` | List and patch stored server records. |
| `tables` | `mathesar/rpc/tables/base.py` | List, get, add, patch, delete, import, import preview, joinable tables. |
| `tables.metadata` | `mathesar/rpc/tables/metadata.py` | Table metadata stored in Django. |
| `tables.privileges` | `mathesar/rpc/tables/privileges.py` | Table-level privileges and ownership. |
| `users` | `mathesar/rpc/users.py` | Mathesar users. Also `users.password.replace_own` and `users.password.revoke`. |

Feature-level context for these namespaces is in `agents/docs/04-features/index.md`.

## Recipe: add or change an RPC method

1. SQL. Add or edit the function in `db/sql/05_msar.sql` (or the more specific file, see `agents/docs/02-backend/sql.md`). Write the docstring comment. Return `jsonb`.
2. SQL object list. If the function is new or its argument types changed, add the new signature to `db/sql/00_msar_all_objects_table.sql`. Keep old signature rows.
3. SQL test. Add `test_*` functions to `db/sql/test_sql_functions.sql`.
4. Python wrapper. Add or edit a function in the matching module under `db/` (for example `db/records.py`) that calls `exec_msar_func`. Use `json.dumps` for `jsonb` arguments.
5. Wrapper tests. `db/tests/wrapper/test_exec_wrappers.py` fails if the SQL function name or argument count does not match the installed SQL. Optional unit tests go next to `db/tests/test_tables.py`.
6. RPC function. Add or edit it in `mathesar/rpc/` with `@mathesar_rpc_method(name=..., auth=...)`, keyword-only parameters, `**kwargs`, TypedDicts, and a Google style docstring.
7. Settings. For a new module, add it to `MODERNRPC_METHODS_MODULES` in `config/settings/common_settings.py`.
8. Registration test. Add a `(function, "exposed.name", [predicate])` tuple to `METHODS` in `mathesar/tests/rpc/test_endpoints.py`. Predicates: `user_is_superuser`, `user_is_authenticated`, or `[]` for anonymous.
9. RPC unit test. Add a test in `mathesar/tests/rpc/` (style in `agents/docs/02-backend/testing.md`).
10. Error codes. For a new exception class, add a row to the right map in `mathesar/rpc/exceptions/error_codes.py`.
11. API docs. Add the Python function name and any new TypedDict to the right block in `docs/docs/api/methods.md`.
12. Frontend client. Add or edit the `rpcMethodTypeContainer` entry in the namespace file under `mathesar_ui/src/api/rpc/` (for example `mathesar_ui/src/api/rpc/records.ts`). A new namespace also goes in `mathesar_ui/src/api/rpc/index.ts`. See `agents/docs/03-frontend/api-client.md`.
13. Page preload. If the method feeds `get_common_data` in `mathesar/views/__init__.py`, check that view code too.
14. Reinstall SQL on your dev database with `agents/bin/rpc databases.upgrade_sql '{"database_id": 1}'`.
15. Run `agents/bin/check`. It picks the suites from the files you changed. Then call the method with `agents/bin/rpc` and check the UI path that uses it.

Notes on the recipe:

- `test_rpc_endpoint_expected_methods` in `mathesar/tests/rpc/test_endpoints.py` compares `METHODS` with `system.listMethods`. It fails for a method that is registered but not listed, and for one that is listed but not registered.
- `test_correctly_exposed` in the same file checks the exposed name, the exception wrapper, and the auth predicate of each entry.
- No test links the TypeScript types to the Python signatures. Keep step 12 in sync by hand.
- A method that only reads or writes Django models skips steps 1 to 5.
- Renaming or removing a parameter is a breaking API change for the frontend. Search `mathesar_ui/src/` for the method name.
