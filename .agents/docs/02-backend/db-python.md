# Python `db` layer

The `db/` package: thin psycopg 3 wrappers around the SQL functions, the status of the deprecated SQLAlchemy code, and the tests for both.
Read this when adding a wrapper for an SQL function, or when a task touches explorations (the last SQLAlchemy user).
The SQL itself is covered in `.agents/docs/02-backend/sql.md`.

## What the package is

- `db/` is a plain Python package. Outside `db/deprecated/` and tests it imports only `psycopg`, the standard library, and itself.
- It has no Django imports and does not import `mathesar`. Keep it that way: connections and metadata are passed in by callers.
- The "service layer" (`mathesar/`) is the only caller.
- Driver: `psycopg[binary]` 3, pinned in `requirements.txt`.

## Modules

| Module | Contents |
|---|---|
| `db/connection.py` | The central helpers. See the next section. |
| `db/analytics.py` | `get_object_counts`. |
| `db/columns.py` | Column info, add, alter, drop, primary key column, `reset_mash`. Also converts RPC column dicts to the SQL input shape. |
| `db/constraints.py` | List, create, drop constraints. |
| `db/databases.py` | Current database info, `create_database`, `drop_database`. |
| `db/forms.py` | `get_tab_col_info_map`, `form_insert`. |
| `db/links.py` | `add_foreign_key_column`, `add_mapping_table`. |
| `db/records.py` | List, get, search, add, patch, delete records, record summaries, `insert_from_select`. |
| `db/roles.py` | Roles, privileges, ownership transfer, `create_init_login_role`. |
| `db/schemas.py` | List, get, create, patch, drop schemas. |
| `db/tables.py` | Table info, create, alter, drop, import, preview, joinable tables, split and move columns, chunked export, type inference. |
| `db/constants.py` | Internal schema names (`INTERNAL_SCHEMAS`) and `COLUMN_NAME_TEMPLATE`. |
| `db/identifiers.py` | `truncate_if_necessary`: shortens names to the 63-byte Postgres limit with a hash suffix. Used on imported column names. |
| `db/encoding_utils.py` | `get_sql_compatible_encoding`. Nothing in the repo calls it. |
| `db/sql/install.py` | `install` and `uninstall` of the SQL files. |

## Central helpers in `db/connection.py`

| Function | Runs | Returns |
|---|---|---|
| `exec_msar_func(conn, func_name, *args)` | `SELECT msar.<func_name>(%s, ...)` | The cursor. Callers almost always do `.fetchone()[0]`. |
| `select_from_msar_func(conn, func_name, *args)` | `SELECT * FROM msar.<func_name>(%s, ...)` | A list of dicts, one per row. For set-returning functions. One user: `get_constraints_for_table` in `db/constraints.py`. |
| `exec_msar_func_server_cursor(conn, func_name, *args)` | Same query as `exec_msar_func`, on a named server-side cursor | The server cursor. Use it in a `with` block so it is closed. One user: `fetch_table_in_chunks` in `db/tables.py`. |
| `load_file_with_conn(conn, file_handle)` | The whole file as one script | Nothing. Used by the installer. |
| `mathesar_connection(*args, **kwargs)` | `psycopg.connect` | A connection whose `application_name` is prefixed with `Mathesar `. All connections must be created through it. |

- `func_name` is interpolated into the SQL text unescaped. Pass only literal names from code, never user input.
- Arguments are bound as parameters. Positional order must match the SQL function's parameter order.
- Only functions in schema `msar` can be called this way. `__msar` functions are not reachable through the helpers.

## Wrapper conventions

A typical wrapper, from `db/records.py`:

```python
def delete_records_from_table(conn, record_ids, table_oid):
    return db_conn.exec_msar_func(
        conn, 'delete_records_from_table', table_oid, json.dumps(record_ids),
    ).fetchone()[0]
```

- One Python function per SQL function, with little or no logic.
- Call the helper as `db_conn.exec_msar_func(...)` after `from db import connection as db_conn`. Tests patch `db.connection.exec_msar_func`, so a direct `from db.connection import exec_msar_func` would escape the mock.
- `jsonb` parameters: pass `json.dumps(value)`. Use the local helper `_json_or_none` when Python `None` must become SQL NULL instead of JSON `null`.
- Array parameters: pass a Python list (`drop_schemas`, `move_columns_to_referenced_table`).
- Variadic SQL parameters: unpack the list (`drop_columns_from_table` in `db/columns.py`).
- Results: SQL returns one `jsonb` value. psycopg decodes it, so `.fetchone()[0]` is already a dict or list.
- The position of `conn` in the signature is not uniform. `db/records.py` puts it first. `db/schemas.py` and `db/roles.py` often put it last. Check the signature before calling.
- Wrappers do not open, commit, or close connections. The caller's `with connect(...) as conn:` block commits on success and rolls back on an exception.
- Exception: `create_database` and `drop_database` in `db/databases.py` switch the connection to autocommit, because those statements cannot run in a transaction.
- Wrappers do not catch exceptions. psycopg errors travel up to `handle_rpc_exceptions` (see `.agents/docs/02-backend/rpc.md`).

Places where a wrapper does more than forward:

| Function | Extra work |
|---|---|
| `_transform_column_alter_dict`, `_transform_column_create_dict` in `db/columns.py` | Convert the RPC column shape (`id`, `type`, `type_options`, `nullable`, `default.value`) to the SQL shape (`attnum`, `type.name`, `type.options`, `not_null`, `default`). |
| `create_and_import_from_rows` in `db/tables.py` | Calls a prepare function, then streams rows with psycopg `cursor.copy` using the `COPY` statement that SQL returned. |
| `fetch_table_in_chunks` in `db/tables.py` | Generator over a server-side cursor inside `conn.transaction()`. Used for CSV export. |
| `split_table` in `db/tables.py` | Unpacks a two-element result into a dict. |
| `create_init_login_role` in `db/roles.py`, `create_database` in `db/databases.py` | Plain SQL composed with psycopg's `sql` module, because they run before or outside a Mathesar install. |

Argument order differs between layers. Example: RPC `records.patch` takes `record_def, record_id, table_oid`. The wrapper passes `table_oid, record_id, json(record_def)` to SQL. Read all three signatures when changing one.

## Adding a wrapper

1. Write the SQL function first (`.agents/docs/02-backend/sql.md`).
2. Add the Python function to the module that matches the object type.
3. Pass every parameter the SQL function declares, including those with SQL defaults. The wrapper test compares the call's argument count with `pronargs` of each overload and ignores defaults.
4. Add a unit test in `db/tests/` in the style of `db/tests/test_roles.py` if the wrapper transforms its input.
5. Call it from an RPC function or a helper in `mathesar/utils/`. Never call `exec_msar_func` from `mathesar/`.

The full cross-layer recipe is in `.agents/docs/02-backend/rpc.md`.

## `db/deprecated/` and SQLAlchemy

`db/deprecated/` is the previous database layer: SQLAlchemy reflection, a type system, and a query builder. Most of the product has moved to SQL functions. The package is still imported at runtime.

| Still uses it | For what |
|---|---|
| `mathesar/utils/explorations.py` | `run_exploration` builds a `DBQuery` with transforms and aggregates. Reached from RPC `explorations.run` and from exploration CSV export in `mathesar/views/export.py`. |
| `db/columns.py` | Imports `PostgresType` from `db/deprecated/types/base.py` for the default column type id. |
| `mathesar/middleware.py` | `CursorClosedHandlerMiddleware` catches `sqlalchemy.exc.InterfaceError`. |
| `conftest.py` (repo root) | Test database creation uses SQLAlchemy engines and `sqlalchemy_utils`. |
| `db/tests/wrapper/test_exec_wrappers.py` | `engine_to_psycopg_conn` from `db/deprecated/utils.py`. |
| `mathesar/rpc/exceptions/error_codes.py` | Code ranges for `db.` and `sqlalchemy` exceptions. |

Main pieces:

| Path | Contents |
|---|---|
| `db/deprecated/engine.py` | Engine factory on the `postgresql+psycopg` dialect. Patches `PGDialect._reflect_type` at import time so reflection knows Mathesar custom types. |
| `db/deprecated/queries/base.py` | `DBQuery`, `InitialColumn`, `JoinParameter`. |
| `db/deprecated/transforms/base.py` | `Filter`, `Order`, `Limit`, `Offset`, `Summarize`, `HideColumns`, `SelectSubsetOfColumns`. |
| `db/deprecated/functions/base.py`, `db/deprecated/functions/packed.py` | Filter predicates and aggregates used in exploration specs, identified by string ids. |
| `db/deprecated/types/` | `PostgresType`, `MathesarCustomType`, SQLAlchemy classes for custom types. |
| `db/deprecated/columns.py`, `db/deprecated/tables.py` | `MathesarColumn`, table reflection by OID. |

How an exploration runs:

- `run_exploration` receives the caller's psycopg connection, reads user, password, host, port, and database from `conn.info`, and creates a new SQLAlchemy engine with them.
- The query therefore runs with the same Postgres role, but on a different connection and transaction than `conn`.
- The deprecated code calls some `msar` SQL functions by name: `msar.peak_time`, `msar.peak_month`, `msar.uri_*`, `msar.email_domain_name`. Renaming those in SQL breaks explorations.

What to do with it:

- Do not build new features on `db/deprecated/` or on SQLAlchemy. New database logic goes into SQL functions plus wrappers.
- Do not delete or "clean up" modules there without checking the import chain from `mathesar/utils/explorations.py`.
- Bug fixes to exploration behavior belong there, with tests under `db/tests/deprecated/`.
- `SQLAlchemy` is pinned in `requirements.txt`. `SQLAlchemy-Utils` is in `requirements-dev.txt` and is used only by test fixtures.
- The project intends to remove SQLAlchemy (`https://wiki.mathesar.org/archive/product/projects/future/sql-alchemy-remove/`). Explorations are the last feature that needs it.

## Tests in `db/tests/`

| Path | What it tests | Needs |
|---|---|---|
| `db/tests/test_columns.py`, `db/tests/test_roles.py`, `db/tests/test_tables.py` | Wrappers, with `db.connection.exec_msar_func` patched. Assert the SQL function name and arguments. | No user database queries |
| `db/tests/wrapper/test_exec_wrappers.py` | Every `exec_msar_func` call found by parsing the source under `db/`. | The test database with Mathesar SQL installed |
| `db/tests/deprecated/` | The SQLAlchemy layer: types, filters, queries, summarization. | The test database plus SQL fixtures in `db/tests/deprecated/resources/` |

Details of `db/tests/wrapper/test_exec_wrappers.py`:

- `test_db_wrapper` is parametrized over every `exec_msar_func` call in `db/`. It asserts that the named function exists in schema `msar` and that the number of arguments passed equals the declared parameter count (`pronargs`) of some overload.
- `test_no_exec_calls_from_mathesar` asserts that no file under `mathesar/` calls `exec_msar_func`.
- The scan matches calls named `exec_msar_func` only. Calls through `select_from_msar_func` and `exec_msar_func_server_cursor` are not checked.
- The scan uses the relative paths `db/` and `mathesar/`. Run pytest from the repo root.
- The check counts positional arguments in the source. A call that unpacks a list (`*column_attnums`) is counted as one argument.

All pytest runs, including these, need a reachable PostgreSQL server because of session fixtures. See `.agents/docs/02-backend/testing.md`.
