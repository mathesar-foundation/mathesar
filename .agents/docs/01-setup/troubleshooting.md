# Troubleshooting the sandbox

Known failures when installing, running and testing Mathesar from source, with the fix for each. Read this when a script in `.agents/bin/` or a test run fails for a reason that is not your change.

## Running the app

| Symptom | Cause | Fix |
|---|---|---|
| `PostgreSQL is not accepting connections` | Local cluster is down or the port differs. | `pg_lsclusters`, then `pg_ctlcluster <version> main start`. Set `POSTGRES_PORT` if it is not 5432. |
| Page is blank or unstyled | Vite is not running, or the browser cannot reach port 3000. | `.agents/bin/start`, then read `/tmp/mathesar-dev/vite.log`. |
| First page shows "Complete installation" | No Mathesar superuser exists. | `.agents/bin/setup`. |
| Login redirects to a password change form | New users must change their password at first UI login. | Submit the form, or use RPC with basic auth, which is not affected. |
| `django did not start` | Port 8000 is taken, or a migration is missing. | Read `/tmp/mathesar-dev/django.log`. Export `MATHESAR_PORT` to use another port. |
| RPC returns `NoConnectionAvailable` | The calling user is not a collaborator on that database, or the `msar` schema is gone. | Add a collaborator, or reinstall the SQL (below). |

## Your SQL change has no effect

Editing `db/sql/*.sql` does not change databases that already have Mathesar's functions installed. Reinstall them into the database you are testing with:

```
.agents/bin/rpc databases.upgrade_sql '{"database_id": 1}'
```

The pgTAP tests are not affected. They load the SQL files into a fresh database on every run.

## `cannot change name of input parameter`

```
psycopg.errors.InvalidFunctionDefinition: cannot change name of input parameter "tab_id"
HINT:  Use DROP FUNCTION msar.drop_table(oid,boolean,boolean) first.
```

The database holds Mathesar functions that this branch does not list in its object registry (`db/sql/00_msar_all_objects_table.sql`), usually installed from another branch. A reinstall drops only registered objects, and PostgreSQL cannot replace a function when parameter names or the return type differ. Drop the Mathesar schemas in the user database and reinstall. Tables and their rows stay. `CASCADE` also drops any object in other schemas that depends on a Mathesar function, for example a view that calls one, and the reinstall does not bring those back. Do this on a sandbox database only.

```
source .agents/bin/dev-env
PGPASSWORD=$POSTGRES_PASSWORD psql -h $POSTGRES_HOST -p $POSTGRES_PORT -U $POSTGRES_USER -d sandbox -c 'DROP SCHEMA msar, __msar CASCADE;'
.agents/bin/rpc databases.upgrade_sql '{"database_id": 1, "username": "mathesar", "password": "mathesar"}'
```

The credentials are required here. Without them Mathesar looks up the owner of the `msar` schema, which no longer exists.

If your own change adds a function or changes an argument list, add the new signature to the registry so that upgrades of existing installs work. `.agents/bin/check sql-registry` finds missing rows. Details: `.agents/docs/02-backend/sql.md`.

## Tests and linters

| Symptom | Cause | Fix |
|---|---|---|
| `flake8 .` reports thousands of errors | It scans `.venv/`. | `.agents/bin/check python-lint`. |
| `npm test` never exits | Vitest watches for changes unless the `CI` variable is set. | `npx vitest run`, or `.agents/bin/check frontend`. |
| `pg_prove not found` | pgTAP tools are not installed. | `.agents/bin/setup --sql-tests`. |
| SQL tests fail at `CREATE DATABASE mathesar_testing` | A killed run left the database behind. | `DROP DATABASE mathesar_testing WITH (FORCE);` |
| Every `pytest` test errors at setup with a connection error | The `POSTGRES_*` variables are not set. | `source .agents/bin/dev-env`, or use `.agents/bin/check python-tests`. |
| `Requests to 3rd party addresses make bad tests` | A test made a real HTTP call. The root `conftest.py` blocks them. | Mock the call (the suite uses `responses` and `monkeypatch`). |

`pytest` creates databases named `mathesar_db_test_<worker>` and drops them at the end. A later run drops leftovers from a killed run.

## Start over

```
.agents/bin/stop
source .agents/bin/dev-env
export PGPASSWORD=$POSTGRES_PASSWORD
psql -h $POSTGRES_HOST -p $POSTGRES_PORT -U $POSTGRES_USER -d postgres -c 'DROP DATABASE IF EXISTS sandbox WITH (FORCE);'
psql -h $POSTGRES_HOST -p $POSTGRES_PORT -U $POSTGRES_USER -d postgres -c 'DROP DATABASE IF EXISTS mathesar_django WITH (FORCE);'
.agents/bin/setup && .agents/bin/start && .agents/bin/seed
```

Dropping `mathesar_django` removes users, connections, saved explorations and forms. Add any other databases you created to the list.

## Still stuck

- `DEVELOPER_GUIDE.md`, section "Troubleshooting": Windows, WSL and Docker port problems.
- `docs/docs/administration/debug.md`: debugging a production install.
