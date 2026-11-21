# Drive a running Mathesar

How to use a running instance as a user would: through the JSON-RPC API and through the browser UI. Read this when you need to reproduce a bug, check a change in the real app, or collect evidence for a PR. Assumes the app is running (see [install-sandbox.md](./install-sandbox.md)).

## Logins

| Who | Username | Password | Notes |
|---|---|---|---|
| Mathesar admin | `admin` | `password` | Created by `agents/bin/setup` and by the Docker dev stack. |
| PostgreSQL superuser role | `mathesar` | `mathesar` | Owns the internal database. Also the default role for databases created through `agents/bin/seed`. |

Everything below works the same against the production stack (`agents/bin/prod up`): run `export MATHESAR_URL=http://localhost` first. Differences are listed in [production-stack.md](./production-stack.md).

## Seed data

```
agents/bin/seed                                # database "sandbox" with library_management
agents/bin/seed library_management bike_shop   # choose datasets (only applies when the database is new)
MATHESAR_SEED_DB=perf agents/bin/seed library_management   # another database
```

The command prints the Mathesar database id. The datasets are SQL files in `mathesar/examples/resources/`. Library Management is the largest and the one to use for performance checks.

## Call the RPC API

All application calls go to `POST /api/rpc/v0/` as JSON-RPC 2.0 with named parameters. The endpoint accepts a session cookie or HTTP basic auth. `agents/bin/rpc` uses basic auth:

```
agents/bin/rpc databases.configured.list
agents/bin/rpc schemas.list '{"database_id": 1}'
agents/bin/rpc tables.list '{"database_id": 1, "schema_oid": 44097}'
agents/bin/rpc columns.list '{"database_id": 1, "table_oid": 44116}'
agents/bin/rpc records.list '{"database_id": 1, "table_oid": 44116, "limit": 5}'
agents/bin/rpc records.add '{"database_id": 1, "table_oid": 44116, "record_def": {"2": "Ada", "3": "Lovelace"}}'
```

Things that differ from most APIs:

- Objects in a user database are addressed by PostgreSQL OID (`schema_oid`, `table_oid`). OIDs differ per database, so list first.
- Columns are addressed by `attnum`. Record objects are keyed by attnum as a string: `{"1": 1, "2": "Ada"}`. Get names from `columns.list`.
- `database_id`, `server_id`, `user_id` are Django model ids from the internal database.
- Every response is HTTP 200. Failure is an `error` object in the body. `agents/bin/rpc` prints it to stderr and exits 1.
- Find a method and its parameters with `grep -rn 'mathesar_rpc_method(name="tables' mathesar/rpc`. The docstrings are the API reference. See `agents/docs/02-backend/rpc.md`.

Run as another user with `MATHESAR_USER=intern MATHESAR_PASSWORD=... agents/bin/rpc ...`.

## Other HTTP endpoints

| Endpoint | Use |
|---|---|
| `/healthz/live/`, `/healthz/ready/` | Liveness and readiness. Ready checks the internal database. |
| `/api/db/v0/data_files/` | Upload a CSV or TSV before an import (multipart, session auth with CSRF token). |
| `/api/export/v0/tables/`, `/api/export/v0/explorations/` | CSV export. |
| `/files/` | File column uploads and downloads. |

These are plain Django views in `mathesar/views/`, listed in `mathesar/urls.py`.

## Drive the UI with Playwright

Take a screenshot of any page as the admin user:

```
agents/bin/screenshot /db/1/schemas/ /tmp/schemas.png
agents/bin/screenshot /db/1/schemas/44097/tables/44116/ /tmp/table.png --wait-for '[data-sheet-element="data-cell"]'
```

For interactions, write a short script that starts from a logged-in page:

```js
const { openMathesar } = require('./agents/playwright/session.cjs');

(async () => {
  const { browser, page, problems } = await openMathesar();
  await page.goto('/db/1/schemas/44097/tables/44116/');
  const cells = page.locator('[data-sheet-element="data-cell"]');
  await cells.first().waitFor();
  await cells.nth(1).dblclick();          // enter edit mode
  await page.keyboard.press('Control+A');
  await page.keyboard.type('Zed');
  await page.keyboard.press('Enter');     // save
  await page.waitForLoadState('networkidle');
  console.log(problems);                  // page errors and console errors
  await browser.close();
})();
```

- `openMathesar` reads `MATHESAR_URL`, `MATHESAR_USER`, `MATHESAR_PASSWORD`.
- Playwright is not a dependency of this repo. If `require('playwright')` fails, the error message gives the install commands.
- Confirm what the UI did with an RPC call (`records.list`) or with `psql`. Check the data, not only the screenshot.

### URLs

| Page | URL |
|---|---|
| Home (database list) | `/` |
| Database (schema list) | `/db/<database_id>/schemas/` |
| Schema (tables, explorations, forms) | `/db/<database_id>/schemas/<schema_oid>/` |
| Table | `/db/<database_id>/schemas/<schema_oid>/tables/<table_oid>/` |
| Record | `/db/<database_id>/schemas/<schema_oid>/tables/<table_oid>/<record_pk>` |
| Administration | `/administration/users/`, `/administration/settings/` |

The full route table is in `agents/docs/03-frontend/routing-pages.md`.

### Selectors

The app has few test ids. These attributes are stable in the table view (the "sheet"):

| Selector | Element |
|---|---|
| `[data-sheet-element="data-cell"]` | A data cell |
| `[data-sheet-element="column-header-cell"]` | A column header |
| `[data-sheet-element="row-header-cell"]` | A row number cell |
| `[data-sheet-element="data-row"]` | A row. The last one is the new record placeholder. |
| `[data-sheet-element="new-column-cell"]` | The add column button |

Elsewhere, select by role and visible text (`page.getByRole('button', { name: 'New Record' })`). UI strings come from `mathesar_ui/src/i18n/languages/en/dict.json`.

## Test as a user with limited privileges

`admin` uses the superuser role `mathesar`, so it never hits a permission error. Permission bugs are a recurring bug class. To reproduce one, add a limited PostgreSQL role and a Mathesar user that uses it:

```
agents/bin/rpc roles.add '{"database_id": 1, "rolename": "reader", "password": "reader", "login": true}'   # note the oid
agents/bin/rpc roles.configured.add '{"server_id": 1, "name": "reader", "password": "reader"}'              # note the id
agents/bin/rpc users.add '{"user_def": {"username": "intern", "password": "password1234", "is_superuser": false}}'
agents/bin/rpc collaborators.add '{"database_id": 1, "user_id": 2, "configured_role_id": 2}'
agents/bin/rpc schemas.privileges.replace_for_roles '{"database_id": 1, "schema_oid": 44097, "privileges": [{"role_oid": 50714, "direct": ["USAGE"]}]}'
agents/bin/rpc tables.privileges.replace_for_roles '{"database_id": 1, "table_oid": 44116, "privileges": [{"role_oid": 50714, "direct": ["SELECT"]}]}'
MATHESAR_USER=intern MATHESAR_PASSWORD=password1234 agents/bin/rpc records.list '{"database_id": 1, "table_oid": 44116}'
```

Replace the ids and OIDs with the ones your calls return. A new user must change the password at first UI login (redirect to `/auth/password_reset_confirm/`). RPC calls with basic auth are not affected.

## Look inside the databases

```
source agents/bin/dev-env
PGPASSWORD=$POSTGRES_PASSWORD psql -h $POSTGRES_HOST -U $POSTGRES_USER -d mathesar_django   # internal database
PGPASSWORD=$POSTGRES_PASSWORD psql -h $POSTGRES_HOST -U $POSTGRES_USER -d sandbox           # a user database
```

In a user database, Mathesar's functions live in the `msar` schema. Call one directly to tell a SQL bug from a Python bug:

```sql
select jsonb_pretty(msar.get_table('"Bike Shop"."Mechanics"'::regclass));
```

See `agents/docs/02-backend/sql.md`.

Logs: `/tmp/mathesar-dev/django.log` has Python tracebacks. `/tmp/mathesar-dev/vite.log` has front end compile errors.
