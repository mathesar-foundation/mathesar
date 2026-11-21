# Mathesar: guide for coding agents

Mathesar is a self-hosted web app that gives a spreadsheet-like UI to PostgreSQL databases. This file is the entry point for AI coding agents. The map of the codebase is in `agents/docs/`. Scripts to install, run and check the app are in `agents/bin/`.

Humans: see `CONTRIBUTING.md` and `DEVELOPER_GUIDE.md`.

## The system in six lines

- Front end: Svelte 3 and TypeScript in `mathesar_ui/`. It talks to one JSON-RPC endpoint, `POST /api/rpc/v0/`.
- Service: one Django app in `mathesar/` (RPC methods in `mathesar/rpc/`), settings in `config/`.
- Database layer: thin psycopg wrappers in `db/*.py` that call PL/pgSQL functions defined in `db/sql/`.
- Most logic that touches user data is in those SQL functions (schema `msar`), installed into every connected database.
- Two kinds of database: the internal one (Django models: users, connections, metadata) and the user databases (the data).
- Permissions on data are PostgreSQL privileges. Each call connects as the PostgreSQL role mapped to the Mathesar user.

## Commands

All verified on Ubuntu 24.04. Develop on the native setup, which needs no Docker and is fast. Check on the production stack when a change could behave differently there.

| Command | Does |
|---|---|
| `agents/bin/setup` | Installs the native dev setup: PostgreSQL role and database, `.venv`, `node_modules`, migrations, user `admin` / `password`. Safe to re-run. Add `--sql-tests` for pgTAP |
| `agents/bin/start`, `agents/bin/stop` | Runs Django on port 8000 and Vite on port 3000 in the background. Logs in `/tmp/mathesar-dev/` |
| `agents/bin/prod up` | Builds images from your working tree and runs the production `docker-compose.yml` at `http://localhost`. Needs Docker, takes about 4 minutes. Also `down`, `reset`, `logs`, `up --release <version>` |
| `agents/bin/seed` | Creates a database with sample data, prints its id |
| `agents/bin/rpc <method> '<json>'` | Calls an RPC method on the running app, prints the result |
| `agents/bin/screenshot <path> <file.png>` | Logs in with Playwright and captures a page |
| `agents/bin/check` | Runs the test and lint suites that CI would run for your changed files |
| `agents/bin/check <suite>` | One suite: `python-tests`, `python-lint`, `sql-tests`, `sql-registry`, `api-tests`, `frontend`, `docs`, `agents-docs`, or `all` |

Pass arguments to a suite after `--`: `agents/bin/check python-tests -- -k test_name`, `agents/bin/check sql-tests -- -x name_part`.

`seed`, `rpc` and `screenshot` talk to the dev servers by default. Point them at the production stack with `export MATHESAR_URL=http://localhost`.

## How to work on a task

1. Orient. Find the feature in `agents/docs/04-features/index.md`, then read the docs listed below for each layer you will touch. Done when you can name the files you will change in every layer.
1. Baseline. Start the app and reproduce the bug or see the current behavior through `agents/bin/rpc` or the UI. Done when you have observed it yourself.
1. Change. Keep the diff to what the task needs. Match the code around it.
1. Check. Run `agents/bin/check`. Done when every suite it picks passes.
1. Verify in the running app. Reinstall SQL if you changed it (see the rules below). Exercise the change through RPC and, for UI work, in the browser. Done when you have seen the new behavior and have evidence (command output, a screenshot).
1. Verify on the production stack when the change touches any of: Dockerfiles, compose files, `Caddyfile`, `build-scripts/`, dependencies, `config/settings/`, static files or the front end build, URLs and redirects, file upload or download, Django migrations, or SQL that existing installs will upgrade to. Run `agents/bin/prod up` and repeat the check there. For migrations and SQL, run the upgrade test in `agents/docs/01-setup/production-stack.md`. Done when you have seen the behavior on that stack, or have said in your report why you could not.
1. Document. User-visible change: update `docs/docs/`. Moved, renamed or restructured code: update the matching file in `agents/docs/`.
1. Hand off. Follow `agents/docs/00-general/workflow.md` for the PR. Report what you verified, how, and what you could not verify.

## Rules that prevent breakage

SQL (`db/sql/`):

- Every function, type and table the SQL files create needs a row in `db/sql/00_msar_all_objects_table.sql`. Add a row for a new object or a changed argument list. Keep old rows. `agents/bin/check sql-registry` verifies it.
- Editing SQL does not change a running database. Apply it with `agents/bin/rpc databases.upgrade_sql '{"database_id": 1}'`.
- SQL logic is tested with pgTAP in `db/sql/test_sql_functions.sql`. pytest mocks the SQL calls, so a green pytest run says little about SQL. `agents/bin/check api-tests` runs real RPC calls against real SQL.

RPC (`mathesar/rpc/`):

- A method needs: the decorated function, an entry in `METHODS` in `mathesar/tests/rpc/test_endpoints.py`, an entry in `docs/docs/api/methods.md`, and the hand-written TypeScript binding in `mathesar_ui/src/api/rpc/`. Nothing checks that the TypeScript types match Python.
- `@mathesar_rpc_method` defaults to admin-only. Pass `auth="login"` for methods that standard users call.
- Database objects are addressed by OID (`table_oid`, `schema_oid`) and columns by `attnum`. `database_id` is a Django id.
- Do not check data permissions in Python. PostgreSQL enforces them for the connected role.

Front end (`mathesar_ui/`):

- Svelte 3 with `immutable: true`. Replace objects and arrays. In-place mutation does not re-render.
- All UI text goes through `mathesar_ui/src/i18n/languages/en/dict.json`. Edit English only. Other languages come from Transifex.
- Pages, systems, stores and the RPC client have no automated tests. Verify those changes in the running app.

Everywhere:

- Supported runtimes are Python 3.10 to 3.14, PostgreSQL 14 to 18, Node 18. Use only features available in all of them.
- The sandbox role `mathesar` is a PostgreSQL superuser. Test anything permission-related as a limited role (`agents/docs/01-setup/drive-the-app.md`).
- Leave versions, tags, release notes and non-English translation files to maintainers.
- Never commit secrets, `.env`, or files created at runtime (`static/`, `.media/`, `.secrets/`).

## Docs index

The docs are a map. The code is the truth: when they disagree, trust the code and fix the doc.

| Read | When |
|---|---|
| `agents/docs/00-general/architecture.md` | First task here. Deciding which layer a change belongs to |
| `agents/docs/00-general/product.md` | Changing user-facing behavior. Naming things. Writing UI text |
| `agents/docs/00-general/repo-map.md` | Looking for where something lives |
| `agents/docs/00-general/workflow.md` | Before opening an issue, a branch or a PR |
| `agents/docs/00-general/history.md` | Code looks inconsistent. Proposing a change of direction |
| `agents/docs/01-setup/install-sandbox.md` | First run in a new sandbox. Which setup to use |
| `agents/docs/01-setup/production-stack.md` | Running the production Docker Compose setup. Upgrade tests. What only that setup reveals |
| `agents/docs/01-setup/drive-the-app.md` | Reproducing a bug. Calling RPC. Driving the UI with Playwright. Testing as a limited user |
| `agents/docs/01-setup/troubleshooting.md` | A script or test fails for a reason that is not your change |
| `agents/docs/02-backend/overview.md` | Any change under `config/`, `mathesar/` or `db/` |
| `agents/docs/02-backend/rpc.md` | Adding or changing an RPC method. Error codes. API docs |
| `agents/docs/02-backend/sql.md` | Editing `db/sql/`. Install, upgrade, pgTAP tests |
| `agents/docs/02-backend/db-python.md` | Wrappers in `db/`. Explorations and the SQLAlchemy code |
| `agents/docs/02-backend/models.md` | Django models, metadata, migrations |
| `agents/docs/02-backend/auth-permissions.md` | Login, SSO, roles, collaborators, public forms, secrets |
| `agents/docs/02-backend/testing.md` | Writing or running backend tests. What each suite catches |
| `agents/docs/03-frontend/overview.md` | Any change under `mathesar_ui/` |
| `agents/docs/03-frontend/routing-pages.md` | Adding a page or URL |
| `agents/docs/03-frontend/state-stores.md` | Data loading, stores, table view state |
| `agents/docs/03-frontend/api-client.md` | Calling the backend from the front end |
| `agents/docs/03-frontend/components.md` | Building UI: existing components, styling, modals, data type cells |
| `agents/docs/03-frontend/i18n.md` | Adding or changing any UI text |
| `agents/docs/03-frontend/testing-lint.md` | Front end checks and their failure modes |
| `agents/docs/04-features/index.md` | An issue names a feature and you need the code locations |
| `agents/docs/05-ops/build-release.md` | Docker, packaging, dependencies, CI workflows, docs site, release |

Standards written for humans that also bind you: `mathesar_ui/STANDARDS.md` (front end code), `db/sql/STANDARDS.md` (SQL), `docs/STYLE_GUIDE.md` (user docs).

How this folder is organized and kept current: `agents/README.md`.
