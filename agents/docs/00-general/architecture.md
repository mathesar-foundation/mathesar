# Architecture

The system on one page: the layers, how a request flows, where state lives, and the design rules that decide where new code goes. Read this before your first change. Details are in `agents/docs/02-backend/overview.md` and `agents/docs/03-frontend/overview.md`.

## Layers

```
Browser      Svelte 3 single-page app            mathesar_ui/src/
   |  JSON-RPC 2.0 over POST /api/rpc/v0/ (plus a few plain HTTP endpoints for files)
Django       RPC methods, auth, metadata         mathesar/ and config/
   |  one psycopg connection per call, opened as the user's PostgreSQL role
db package   thin wrappers, no Django imports    db/*.py
   |  SELECT msar.<function>(...)
PostgreSQL   PL/pgSQL functions in schema msar   db/sql/*.sql, installed into every user database
```

Two kinds of database are involved:

| | Internal database | User databases |
|---|---|---|
| Holds | Mathesar users, connections, stored role passwords, display metadata, saved explorations, forms | The data people work on |
| Count | One | Any number, on any reachable PostgreSQL server |
| Accessed with | Django ORM | psycopg, raw connections |
| Mathesar SQL installed | No | Yes: schemas `msar`, `__msar`, `mathesar_types` |

## One request, end to end

Example: the table page loads records.

1. The front end calls `api.records.list({ database_id, table_oid, ... }).run()` (`mathesar_ui/src/api/rpc/records.ts`).
1. Django routes `POST /api/rpc/v0/` to the function registered as `records.list` (`mathesar/rpc/records.py`).
1. The decorator `mathesar_rpc_method` checks login and that the user is a collaborator on that database.
1. The function opens a connection to the user database as the PostgreSQL role mapped to that user.
1. It calls a wrapper in `db/records.py`, which runs `SELECT msar.list_records_from_table(...)`.
1. The SQL function builds and runs the query and returns one `jsonb` value. PostgreSQL enforces the role's privileges.
1. The Python function adds Mathesar metadata from the internal database and returns. The connection commits and closes.

## Design rules

These explain most of the code layout. Follow them in new code.

1. Logic that reads or changes a user database goes in SQL functions. Python wrappers stay thin. This was a performance decision made in 2023 and 2024: one round trip per operation.
1. One RPC call maps to about one SQL function call.
1. Database objects are identified by OID (`table_oid`, `schema_oid`) and columns by `attnum`, never by name. Names are fetched only to show them.
1. Django stores no copy of database structure. There is no `Table` or `Column` model. Structure is read live on every request.
1. Permissions on user data are PostgreSQL privileges of the connected role. Django only decides who may call a method and for which database.
1. `db/` does not import Django or `mathesar`. `mathesar/` does not call SQL functions directly (a test enforces it).
1. The front end types for RPC methods are written by hand in `mathesar_ui/src/api/rpc/`. No test links them to the Python signatures. Change both sides together.
1. `mathesar_ui/src/component-library/` imports nothing from the rest of the app.

## Where state lives

| State | Location |
|---|---|
| User data, structure, roles, privileges | The user database |
| Display options, column order, record summary templates | Internal database: `TableMetaData`, `ColumnMetaData` |
| Saved explorations, forms | Internal database: `Explorations`, `Form`, `FormField` |
| Who uses which role on which database | Internal database: `UserDatabaseRoleMap` |
| Table view filters, sorting, grouping, pagination | The `q` URL parameter |
| UI preferences (theme, panel widths) | Browser `localStorage` |
| Uploaded CSV files | Django default storage (`.media/` or Azure) |
| File column contents | An S3-compatible or Azure object store |

## How the front end is served

Django renders one HTML shell (`mathesar/templates/mathesar/index.html`) for every app URL and embeds preloaded data in it. In development the shell loads modules from the Vite dev server on port 3000. In production it loads the built bundle from `mathesar/static/`. Login, password change and first-run pages are server-rendered Django templates and are not part of the Svelte app.

## Legacy areas

| Area | Status |
|---|---|
| `db/deprecated/` | SQLAlchemy query builder. Only the Data Explorer still runs through it. No new code there. |
| Schema `__msar` | Old private SQL helpers. Still required. Do not add to it or call it from Python. |
| `mathesar_ui/src/api/rest/` | The REST API was removed in December 2025. What is left serves file upload endpoints, plus a request status type used across the app. |
| `*.stories.svelte` files | Storybook was removed. The files are leftovers. |

## Deployment shapes

All run the same Django app behind gunicorn. See `agents/docs/05-ops/build-release.md`. To run the first one from your working tree, see `agents/docs/01-setup/production-stack.md`.

| Shape | Defined in |
|---|---|
| Docker Compose with Caddy and a bundled PostgreSQL | `docker-compose.yml` |
| Single Docker image | `Dockerfile`, targets `production` and `minimal` |
| Install script on Linux or macOS | `build-scripts/install/install.sh`, started with `build-scripts/bin/mathesar.sh` |
