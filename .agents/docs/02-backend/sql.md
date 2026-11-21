# SQL layer

What is in `db/sql/`, how it is installed and upgraded in user databases, how the 6000-line main file is organized, and how to test it.
Read this before editing any SQL file or debugging a failed install, upgrade, or disconnect.
Human docs: `db/sql/README.md` (schemas, pgTAP commands) and `db/sql/STANDARDS.md` (naming, quoting, OID casting).

## Files

| File | Holds |
|---|---|
| `db/sql/00_msar_all_objects_table.sql` | Creates schema `msar` and rebuilds the table `msar.all_mathesar_objects`: a registry of every object any Mathesar version has created. |
| `db/sql/01_msar_types.sql` | Schema `mathesar_types` and its custom types, in idempotent `DO` blocks. |
| `db/sql/02_msar_remove.sql` | `msar.drop_all_msar_objects`, the function that removes registered objects. |
| `db/sql/05_msar.sql` | Starts by dropping all registered objects, then defines most functions. |
| `db/sql/10_msar_joinable_tables.sql` | Type `msar.joinable_tables` and `msar.get_joinable_tables`: walks foreign keys to find join paths. |
| `db/sql/30_msar_custom_aggregates.sql` | Aggregates `msar.peak_time` and `msar.peak_month`. Called only from `db/deprecated/` (explorations). |
| `db/sql/45_msar_type_casting.sql` | Table `msar.top_level_domains`, URI and email part functions, all `msar.cast_to_*` functions. |
| `db/sql/46_msar_type_inference.sql` | `msar.infer_table_column_data_types` and helpers. |
| `db/sql/50_msar_permissions.sql` | Grants to `PUBLIC`. Must stay last. Its header forbids adding functions after it. |
| `db/sql/install.py` | `INSTALL_STEPS`, `install(conn)`, `uninstall(conn, ...)`. |
| `db/sql/test_sql_functions.sql` | All pgTAP tests. |
| `db/sql/test_startup.sql`, `db/sql/test_shutdown.sql`, `db/sql/run_tests.sh` | Test database setup, teardown, and runner. |
| `db/sql/show_functions.sh` | Prints all function names from the dev database container. |

## Schemas created in user databases

| Schema | Purpose |
|---|---|
| `msar` | Main schema. Functions the Python layer calls, plus types and two tables: `msar.expr_templates` and `msar.top_level_domains`. The registry table `msar.all_mathesar_objects` exists only during an install or uninstall. A successful install drops it. |
| `__msar` | Deprecated private helpers and composite types (`__msar.col_def`, `__msar.con_def`). Still required. Do not add to it or call it from Python. |
| `mathesar_types` | Types users can put on their own columns: domains `email`, `uri`, `mathesar_money`, `mathesar_json_array`, `mathesar_json_object`, and composite `multicurrency_money`. |

- `mathesar_inference_schema` and `msar_views` appear only in the drop call at the top of `db/sql/05_msar.sql`. They are legacy schemas removed from old installs.
- The schema name list is repeated in `db/constants.py` (`INTERNAL_SCHEMAS`), in SQL function `msar.mathesar_system_schemas()`, and in default arguments of `Database.uninstall_sql` and `databases.configured.disconnect`.
- RPC `schemas.list` hides the internal schemas in Python.
- Nothing is installed in the internal Django database.

## Install order and mechanism

- `install(conn)` in `db/sql/install.py` runs the nine numbered files in `INSTALL_STEPS` order on one psycopg connection.
- Each file is sent whole with `conn.execute`. The caller's `with` block commits once at the end, so an install is one transaction.
- Callers are listed under "Install flow" in `.agents/docs/02-backend/overview.md`. `Database.install_sql` then stores `mathesar.__version__` in `Database.last_confirmed_sql_version`.
- `db/sql/test_startup.sql` repeats the same file list with `\ir`. A new SQL file must be added to both lists.
- Every function is `SECURITY INVOKER` (no `SECURITY DEFINER` exists in these files). `db/sql/50_msar_permissions.sql` grants schema usage, function execution, and table select to `PUBLIC`.
- Any role can therefore call Mathesar functions. What it can see or change is decided by its own Postgres privileges.

## Upgrades and removal of old objects

There are no SQL migrations. Every install is "drop everything known, then recreate".

1. `db/sql/00_msar_all_objects_table.sql` drops and recreates `msar.all_mathesar_objects` with rows `(obj_schema, obj_name, obj_kind, custom_type)`.
2. The first statement of `db/sql/05_msar.sql` calls `msar.drop_all_msar_objects` with `remove_custom_types => false` and `strict => false`.
3. That function runs `DROP <kind> IF EXISTS <name>` for each registered row, retrying up to 10 passes to get past dependency order.
4. If all drops succeed it drops the registry table, itself, and the schemas with `DROP SCHEMA` (no `CASCADE`). `mathesar_types` and rows with `custom_type = true` are kept, because user columns may use those types.
5. If some object could not be dropped (a user object depends on it), it raises a notice and the install continues.
6. The rest of the files recreate everything.

- `uninstall` in `db/sql/install.py` runs `db/sql/00_msar_all_objects_table.sql` and `db/sql/02_msar_remove.sql`, then the same function with custom types included and the caller's `strict` flag (default true). With `strict`, it raises and rolls back if anything remains.
- `Database.needs_upgrade_attention` is true when `last_confirmed_sql_version` differs from `mathesar.__version__`. The frontend then prompts an admin to upgrade. The backend never upgrades by itself.

Rules that follow:

- Every object the SQL files create must have a row in `db/sql/00_msar_all_objects_table.sql`: functions and aggregates with their exact argument type list, types, and tables.
- `CREATE TYPE` and `CREATE TABLE` statements have no `IF NOT EXISTS`. They only work on reinstall because the registered object was dropped first.
- An unregistered object left in `msar` or `__msar` makes the final `DROP SCHEMA` fail. That breaks reinstall, upgrade, and disconnect for that database.
- Never delete old rows. They are how databases upgraded from older versions lose outdated overloads.
- The file header says the table is generated by an external script (repo `mathesar-scripts`). Git history also shows rows added by hand.
- Row format for functions is the output of `oid::regprocedure::text`, for example `msar.form_insert(jsonb,jsonb)`. Insert a new row next to the other rows of the same name. Do not re-sort or regenerate the file.

## When a function signature changes

| Change | What to do |
|---|---|
| Body only | Nothing extra. |
| Parameter names or return type, same argument types | Nothing extra if the signature is registered. The drop step removes the old definition first. |
| Argument types or count | Add a row for the new signature. Keep the old row. Update the Python wrapper and tests. |
| New function, type, table, or aggregate | Add a row. |
| Function removed | Keep its row. |

- Symptom of a missing row on a dev database: `cannot change name of input parameter`, a "function is not unique" error, or a failing `DROP SCHEMA`.
- Dev fix: drop schemas `msar` and `__msar` by hand, then reinstall (`DEVELOPER_GUIDE.md`, section "Invalid function definition SQL errors").
- No pytest or pgTAP test checks the registry. In CI, only the disconnect step in `api_tests/test_happy_db_setups.py` fails on an unregistered object. Locally, `.agents/bin/check sql-registry` installs the SQL into a scratch database and lists every object that has no row.
- Editing SQL does not touch running databases. Reinstall with `.agents/bin/rpc databases.upgrade_sql '{"database_id": 1}'`. The pytest fixtures and the pgTAP runner always install fresh.

## Conventions

`db/sql/STANDARDS.md` is the authority. In short:

- Abbreviations in names: `sch`, `tab`, `col`, `con`, `att`, `obj`, `rel`. Suffix `_id` for OIDs and attnums, `_name` for names.
- `snake_case` everywhere. Every function has a docstring.
- In `msar`, pass names unquoted and quote only when building SQL. `__msar` uses the older quoted style.
- Prefix catalog tables with `pg_catalog.`.
- Cast OIDs to `bigint` before putting them in JSON.

Observed in the code and not written in the standards:

- The docstring is a block comment that opens right after `AS $$` and has an `Args:` list.
- Parameters that would clash with keywords get a trailing underscore: `limit_`, `order_`, `filter_`, `group_`, `cascade_`, `comment_`.
- Newer functions type identifiers as `regclass`, `regnamespace`, `regrole`. Older ones use `oid`.
- Functions called from Python return a single `jsonb` value. Record objects are keyed by attnum as a string.
- Dynamic SQL is built with `format()` using `%I` and `%L`, then `EXECUTE`.
- `*_info_table()` functions (`msar.column_info_table`, `msar.table_info_table`, `msar.schema_info_table`, `msar.role_info_table`) return rows. The JSON functions wrap them.
- Many functions end with `RETURNS NULL ON NULL INPUT`. Such a function returns NULL without running if any argument is NULL. Do not use it on functions with optional arguments.

## Structure of `db/sql/05_msar.sql`

Sections are marked by banner comments. List them with line numbers:

```
grep -n "^-- [A-Z][A-Z ]*FUNCTIONS" db/sql/05_msar.sql
```

Find a definition (the name is sometimes on the line after `CREATE OR REPLACE FUNCTION`, and sometimes indented):

```
grep -nE '^\s*(CREATE OR REPLACE FUNCTION\s+)?msar\.add_record_to_table\(' db/sql/*.sql
```

Banners in file order, with the functions found under each. Several banners are narrower than their content.

| Banner | Contents (anchor functions) |
|---|---|
| HELPER FUNCTIONS | `msar.mathesar_system_schemas`, `msar.get_unique_local_identifier` |
| GENERAL DDL FUNCTIONS, GENERAL DQL FUNCTIONS | `__msar.build_text_tuple`, `__msar.exec_dql` |
| INFO FUNCTIONS | Name and OID lookups (`msar.get_relation_name`, `msar.get_column_name`, `msar.get_attnum`). Listings: `msar.get_column_info`, `msar.get_table`, `msar.get_table_info`, `msar.list_schemas`, `msar.list_roles`, `msar.get_constraints_for_table`. Privilege listings: `msar.list_db_priv`, `msar.list_schema_privileges`, `msar.list_table_privileges`. Also `msar.get_current_role`, `msar.get_current_database_info`, `msar.get_object_counts`, `msar.set_members_to_role`. |
| ROLE MANIPULATION FUNCTIONS | `msar.create_role`, `msar.drop_role`, `msar.replace_database_privileges_for_roles` and the schema and table variants, `msar.transfer_database_ownership` and variants. |
| ALTER SCHEMA, CREATE SCHEMA, DROP DATABASE, DROP SCHEMA FUNCTIONS | `msar.patch_schema`, `msar.create_schema`, `msar.drop_database_query`, `msar.drop_schemas`. |
| ALTER TABLE FUNCTIONS | `msar.rename_table`, `msar.comment_on_table`, `msar.alter_table`. |
| ALTER TABLE FUNCTIONS: Column operations | `msar.drop_columns`, type `msar.pkey_kind`, type text builders (`msar.build_type_text`), `msar.add_columns`, `msar.add_pkey_column`, `msar.set_pkey_column`. |
| MATHESAR ADD CONSTRAINTS FUNCTIONS | `msar.add_constraints`, `msar.copy_column`, `msar.copy_constraint`. |
| MATHESAR DROP TABLE FUNCTIONS | `msar.drop_table`. |
| MATHESAR DROP CONSTRAINT FUNCTIONS | `msar.drop_constraint`. Also table creation and import: `msar.add_mathesar_table`, `msar.prepare_table_for_import`, `msar.prepare_temp_table_for_import`, `msar.insert_from_select`, `msar.get_preview`. |
| COLUMN ALTERATION FUNCTIONS | `msar.rename_column`, `msar.build_cast_expr`, `msar.retype_column`, default and not-null setters, `msar.alter_columns`, `msar.comment_on_column`. |
| MATHESAR LINK FUNCTIONS | `msar.add_foreign_key_column`, `msar.add_mapping_table`. |
| TABLE SPLITTING FUNCTIONS | `msar.extract_columns_from_table`. |
| COLUMN MOVING FUNCTIONS | `msar.move_columns_to_referenced_table`. |
| DQL FUNCTIONS | The last third of the file. See the next table. |

Inside DQL FUNCTIONS, in file order:

| Topic | Anchors |
|---|---|
| Value formatting | `msar.format_data` overloads |
| Filters | Table `msar.expr_templates` (the valid filter `type` keys), `msar.build_expr`, `msar.build_where_clause` |
| Ordering | `msar.get_total_order`, `msar.build_order_by_expr` |
| Grouping | `msar.build_grouping_expr`, `msar.build_groups_cte_expr` |
| Record summaries | `msar.build_record_summary_query_from_template`, `msar.build_linked_record_summaries_ctes` |
| Record CRUD | `msar.list_records_from_table`, `msar.get_table_columns_and_records` (export), `msar.search_records_from_table`, `msar.get_record_from_table`, `msar.delete_records_from_table`, `msar.add_record_to_table`, `msar.patch_record_in_table` |
| Row seeker | `msar.list_by_record_summaries` |
| Forms | `msar.get_tab_col_info_map`, `msar.build_insert_lookup_table`, `msar.form_insert` |
| File columns | `msar.reset_mash` |
| Joined columns | `msar.build_join_expr`, `msar.get_joined_columns_expr_json` |

To add a filter operator, add a row to `msar.expr_templates`. The frontend must know the new key too.

## Type casting and inference

- Cast functions are named `msar.cast_to_<target>` with one overload per source type. `msar.get_cast_function_name` builds the name: drop the schema, replace spaces with underscores, replace `"` with `_double_quote_`.
- `msar.build_cast_expr` produces the call text. For `numeric` and `mathesar_types.mathesar_money` it passes cast options `group_sep`, `decimal_p`, `curr_pref`, `curr_suff`.
- Casting is used by `msar.retype_column` (so by `msar.alter_columns`), `msar.get_preview`, `msar.insert_from_select`, and type inference.
- `msar.retype_column` always casts through `msar.cast_to_<target>`. A target type without such a function fails.
- `msar.infer_column_data_type` only examines `text` columns. It tries candidate types in a fixed order (the `infer_sequence_raw` array) and takes the first type for which casting the sample succeeds.
- Large tables are sampled with `TABLESAMPLE`. The size table is in the docstring of `msar.infer_table_column_data_types`.
- The result maps attnum to `{"type": ..., "details": {...}}`. `details` carries detected separators to feed back as cast options.

## Permissions inside SQL

- Listing functions only return what the current role may see. Many filter with `has_column_privilege(..., 'SELECT')`.
- Table, schema, and database info include `current_role_priv` and `current_role_owns`. The UI uses them to enable or disable actions.
- `msar.replace_*_privileges_for_roles` grants the listed privileges and revokes the unlisted ones for each role in the input.
- DDL and DML functions do not check privileges themselves. Postgres raises `InsufficientPrivilege`, which reaches the client as an RPC error.
- Installing needs a role that can create schemas in the database. Reinstalling needs the role that owns the existing Mathesar objects. `Database.connect_admin` looks up the owner of schema `msar`.

More in `.agents/docs/02-backend/auth-permissions.md`.

## pgTAP tests

- `db/sql/run_tests.sh` connects as role `mathesar` to database `postgres`, runs `db/sql/test_startup.sql`, runs `pg_prove --runtests` on database `mathesar_testing`, then runs `db/sql/test_shutdown.sql`.
- `db/sql/test_startup.sql` creates `mathesar_testing` and loads the nine SQL files and the test file. A syntax error in any file stops the run before any test.
- `pg_prove --runtests` runs every function whose name starts with `test`. Extra arguments are passed through to `pg_prove`.
- Test function names must be unique. A second `CREATE OR REPLACE` with the same name replaces the first test without an error. Search for the name before you add one.
- Test functions are `test_<what>() RETURNS SETOF TEXT` in PL/pgSQL. Each assertion is `RETURN NEXT <pgTAP call>`.
- Shared setup lives in `__setup_<what>()` functions, called with `PERFORM`.
- Sections are headed by comments like `-- msar.drop_columns ---`. Put new tests next to the tests of the same function.
- Tests create tables and roles and never drop them. They rely on pgTAP rolling back each test.
- Tests run as a superuser. Permission tests switch with `SET ROLE`.
- The dev database image (`Dockerfile.devdb`) installs pgTAP. `docker-compose.dev.yml` mounts `db/sql/` at `/sql/` in the `mathesar_dev_db` container.

Commands:

```
# Without Docker (needs `.agents/bin/setup --sql-tests` once)
.agents/bin/check sql-tests
.agents/bin/check sql-tests -- -x foo_bar

# With Docker (from `db/sql/README.md`)
docker exec mathesar_dev_db /bin/bash /sql/run_tests.sh -v
docker exec mathesar_dev_db /bin/bash /sql/run_tests.sh -v -x foo_bar
```

`-x foo_bar` runs only the tests whose names contain `foo_bar`. The full suite takes about 5 seconds.

## Gotchas

- The Python wrapper tests in `db/tests/wrapper/test_exec_wrappers.py` check SQL function names and argument counts against a freshly installed database. Change SQL and wrapper together.
- `db/sql/10_msar_joinable_tables.sql` says in its header that it is not yet used from Python. That is stale: `list_joinable_tables` in `db/tables.py` calls it.
- The docstring of `Filter` in `mathesar/rpc/records.py` names a table `msar.filter_templates`. The real table is `msar.expr_templates`.
- CI runs the SQL tests on PostgreSQL 14 to 18. Avoid syntax or catalog columns newer than 14.
- `db/sql/00_msar_all_objects_table.sql` is long and mostly data. Search it, do not read it.
