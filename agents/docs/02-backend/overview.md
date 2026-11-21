# Backend overview

Map of the Python and SQL backend: layout, settings, URLs, the request path from browser to PostgreSQL, the two-database model, install flow, imports, file storage, and analytics.
Read this first when a task touches `config/`, `mathesar/`, or `db/`.
Deeper files: `agents/docs/02-backend/rpc.md`, `agents/docs/02-backend/sql.md`, `agents/docs/02-backend/db-python.md`, `agents/docs/02-backend/models.md`, `agents/docs/02-backend/auth-permissions.md`, `agents/docs/02-backend/testing.md`.

## Existing human docs

| File | Covers | Known stale parts |
|---|---|---|
| `DEVELOPER_GUIDE.md` | Docker dev setup, test commands, i18n workflow, file attachment setup, troubleshooting. | "Stack" lists Django REST Framework (not installed). "Usage with preexisting databases" names a settings file and a `DATABASES` key that do not exist. |
| `db/sql/README.md` | The three Postgres schemas, how to run pgTAP tests. | None found. |
| `db/sql/STANDARDS.md` | SQL naming, quoting, OID casting rules. | None found. |
| `docs/docs/api/index.md` | JSON-RPC request and response format, error code ranges, for API users. | Its tip box shows a `"parameters"` key. The real key is `"params"`. |
| `docs/docs/administration/environment-variables.md` | Admin-facing reference for most environment variables. | Omits the variables listed in the table below. Otherwise not audited. |
| `docs/docs/administration/file-backend-config.md` | Configuring file attachment storage. | Not audited. |

## Architecture in five lines

- Most application logic is PL/pgSQL functions in the `msar` schema, installed into each user database.
- `db/` holds thin psycopg 3 wrappers that call those functions. It imports neither Django nor `mathesar`.
- `mathesar/` is the single Django app. It exposes JSON-RPC methods, stores metadata, and renders a few HTML pages.
- `config/` holds Django settings and config parsers.
- The Svelte frontend in `mathesar_ui/` is served as a single-page app and talks to `/api/rpc/v0/`.

## Layout

| Path | Role |
|---|---|
| `manage.py` | Django CLI. Defaults `DJANGO_SETTINGS_MODULE` to `config.settings.production`. |
| `config/settings/common_settings.py` | All real settings. Reads `os.environ` directly. |
| `config/settings/production.py`, `config/settings/development.py` | Thin overrides. Both try to import an optional untracked `local` module in the same package. |
| `config/urls.py` | Root URLconf. Includes `mathesar/urls.py`, adds `/admin/` only when enabled, sets `handler404`. |
| `config/database_config.py` | `PostgresConfig` dataclass and `get_internal_database_config()`. |
| `config/sso_config.py`, `config/login_page_config.py` | Parsers for SSO and login page text config (env JSON or YAML file). |
| `config/context_processors.py` | `frontend_settings`: template context for loading the Svelte bundle and i18n files. |
| `setup/process_env.py` | Used only by `build-scripts/install/install.sh`. Validates Postgres settings in a `.env` file. Not imported by Django. |
| `mathesar/rpc/` | JSON-RPC methods. See `agents/docs/02-backend/rpc.md`. |
| `mathesar/models/` | Django models. See `agents/docs/02-backend/models.md`. |
| `mathesar/views/` | SPA shell views plus the few non-RPC HTTP endpoints. |
| `mathesar/utils/` | Service logic used by RPC functions and views (ORM access, permissions setup, forms, download links, explorations). |
| `mathesar/imports/datafile.py` | CSV/TSV to table import. |
| `mathesar/examples/` | Sample datasets (SQL dumps plus loader functions). |
| `mathesar/management/commands/` | Custom management commands (one). |
| `mathesar/templates/` | Django templates: SPA shell, login, installation, password reset. |
| `mathesar/static/non-code/` | Icons, images, CSS for server-rendered pages. The built frontend goes to a `mathesar` directory next to it (not in the repo). |
| `mathesar/__init__.py` | `__version__`. Compared with each database's installed SQL version. |
| `db/connection.py` and the modules beside it | psycopg wrappers. See `agents/docs/02-backend/db-python.md`. |
| `db/sql/` | SQL sources, installer, pgTAP tests. See `agents/docs/02-backend/sql.md`. |
| `db/deprecated/` | SQLAlchemy code, still used by explorations only. |

## Settings and environment variables

- Django never loads a `.env` file. Docker Compose and `build-scripts/bin/mathesar.sh` export the variables before Python starts.
- `manage.py`, `config/wsgi.py`, and `mathesar/install.py` default to `config.settings.production`. The dev container sets `config.settings.development` in `docker-compose.dev.yml`.
- `config/settings/production.py` forces `MATHESAR_MODE = 'PRODUCTION'` and fixed analytics URLs. `config/settings/development.py` changes nothing.
- Boolean variables are true only for the exact strings `t`, `true`, `True`. Exception: `TEST` is true for any non-empty string.
- `POSTGRES_DB`, `POSTGRES_USER`, and `POSTGRES_HOST` are all required. If one is missing, `DATABASES` stays empty and the first query fails.
- If `SECRET_KEY` is unset, a key is generated once and kept in a text file under `SECRETS_ROOT`, a git-ignored directory named `.secrets` at the repo root.
- `FILE_STORAGE_DICT` is read in `mathesar/utils/download_links.py` at request time, not in settings.
- Config precedence is not uniform. SSO and login page text prefer the env variable over the YAML file. File storage prefers the YAML file over the env variable.

Variables that the admin docs do not cover:

| Variable | Effect |
|---|---|
| `MODE` | `DEVELOPMENT` makes templates load JS from the Vite dev server (`MATHESAR_CLIENT_DEV_PORT`, default 3000). Any other value needs a built frontend manifest. Ignored under production settings. |
| `DEBUG` | Standard Django meaning. |
| `TEST` | Disables the analytics and maintenance background threads. Set by `setup.cfg` for pytest. |
| `PER_USER_DATABASES_ENABLED` | Creates a Postgres role and database per new user. See `agents/docs/02-backend/auth-permissions.md`. |
| `MEDIA_ROOT` | Local directory for uploaded CSV data files. Default is a git-ignored directory named `.media` at the repo root, created at runtime. |
| `MATHESAR_ANALYTICS_URL`, `MATHESAR_INIT_REPORT_URL`, `MATHESAR_FEEDBACK_URL` | Analytics endpoints. Defaults point to `example.com`. Production settings replace them with fixed URLs and ignore these variables. |
| `SKIP_STATIC_COLLECTION` | Read by `mathesar/install.py`. Skips `collectstatic`. |
| `DJANGO_SUPERUSER_PASSWORD` | Password for the `admin` user that `bin/mathesar_dev` creates. |

## URL map

All routes are in `mathesar/urls.py`. Health checks are served by middleware and have no URL pattern.

| URL | Handler | Kind |
|---|---|---|
| `/api/rpc/v0/` | `mathesar/views/__init__.py`, class `MathesarRPCEntryPoint` | JSON-RPC, POST only |
| `/api/db/v0/data_files/`, `/api/db/v0/data_files/<id>/` | `mathesar/views/data_files.py` | JSON, upload and edit CSV data files |
| `/bulk_insert/` | `mathesar/views/bulk_insert.py` | Multipart POST, import a file into an existing table |
| `/api/export/v0/tables/`, `/api/export/v0/explorations/` | `mathesar/views/export.py` | Streaming CSV download, GET with query string |
| `/files/`, `/files/<mash>/`, `/files/<mash>/download/`, `/files/<mash>/thumbnail/` | `mathesar/views/download_link.py` | File attachment upload and download |
| `/complete_installation/` | `mathesar/views/installation/complete_installation.py` | Server-rendered form |
| `/auth/login/`, `/auth/password_reset_confirm/`, other `/auth/` paths | `mathesar/views/users/login.py`, `mathesar/views/users/password_reset.py`, `django.contrib.auth.urls`, `allauth.urls` | Server-rendered |
| `/i18n/` | Django `set_language` | Redirect |
| `/info/analytics_sample_report/` | `analytics_sample_report` | Server-rendered static page |
| `/`, `/profile/`, `/administration/...`, `/db/<id>/...`, `/db/<id>/schemas/<oid>/...` | `home`, `profile`, `admin_home`, `database_route`, `schema_route` | SPA shell, login required |
| `/shares/forms/<token>` | `anonymous_route_home` | SPA shell, no login |
| `/healthz/live`, `/healthz/ready` | `mathesar/middleware.py`, class `HealthCheckMiddleware` | JSON |

- The SPA shell is `mathesar/templates/mathesar/index.html`. It embeds a `common_data` JSON blob built by `get_common_data` in `mathesar/views/__init__.py`.
- `get_common_data` calls RPC functions in-process (databases, servers, schemas, tables, explorations, current user). An RPC change can therefore break page load.
- The `/db/...` patterns are unanchored prefixes. Deeper client-side routes match them.
- Unknown URLs return the SPA shell with status 404 (`page_not_found_view`).

## Middleware

Order is set in `config/settings/common_settings.py`. Custom classes are in `mathesar/middleware.py`.

| Class | Behavior |
|---|---|
| `HealthCheckMiddleware` | Must stay first. Answers before host validation and auth. Readiness runs `SELECT 1` on the internal database with a 2 second timeout. |
| `CursorClosedHandlerMiddleware` | On a SQLAlchemy `InterfaceError`, waits 1 second and runs the request again once. |
| `PasswordChangeNeededMiddleware` | Redirects every session-authenticated request, including RPC calls, to the password change page while `user.password_change_needed` is true. RPC calls with HTTP Basic auth are not redirected, because they authenticate later, inside the RPC decorator. |

`LocaleMiddleware` reads the `display_language` cookie. WhiteNoise serves static files.

## Request lifecycle: `records.list`

1. Browser: `api.records.list({...})` posts `{"jsonrpc": "2.0", "method": "records.list", "params": {...}}` to `/api/rpc/v0/` with the session cookie.
2. `mathesar/urls.py` routes to `MathesarRPCEntryPoint`, a subclass of `modernrpc.views.RPCEntryPoint`.
3. django-modern-rpc finds `records.list` in its registry and checks the auth predicate attached by the decorator.
4. It injects `request` into `kwargs` and calls the wrapped function. Wrappers come from `mathesar/rpc/decorators.py`, function `mathesar_rpc_method`.
5. `ensure_db_authorization` checks that the user has a `UserDatabaseRoleMap` row for `database_id`.
6. `mathesar/rpc/records.py`, function `list_`, loads column metadata and record summary templates from the internal database.
7. `connect(database_id, user)` in `mathesar/rpc/utils.py` opens a psycopg connection to the user database.
8. `db/records.py`, function `list_records_from_table`, calls `exec_msar_func(conn, 'list_records_from_table', ...)` in `db/connection.py`.
9. That runs `SELECT msar.list_records_from_table(%s, ...)`. The function is defined in `db/sql/05_msar.sql` and returns one `jsonb` value.
10. psycopg parses the JSON into a dict. Leaving the `with` block commits and closes the connection.
11. `list_` adds `download_links` and user display values, then returns `RecordList.from_dict(...)`.
12. django-modern-rpc serializes the result. Errors become a JSON-RPC error object with HTTP status 200.

## Two databases

| | Internal database | User databases |
|---|---|---|
| Purpose | Django tables: users, sessions, connection records, metadata, explorations, forms | The data people work on |
| Count | One, `DATABASES['default']` | Any number, one `Database` row each |
| Access | Django ORM | psycopg 3, raw connections, no pool |
| Credentials | `POSTGRES_*` env variables | A stored `ConfiguredRole` per (user, database) pair |
| Mathesar SQL installed | No. `BadInstallationTarget` in `mathesar/utils/permissions.py` blocks it. | Yes: schemas `msar`, `__msar`, `mathesar_types` |

Ways a connection to a user database is opened (all end in `mathesar_connection` in `db/connection.py`):

| Entry point | Role used |
|---|---|
| `UserDatabaseRoleMap.connection`, reached through `connect()` | The role mapped to the calling user for that database. This is the normal path. |
| `Form.connection` | The form's `associated_role`. Used for anonymous form access. |
| `Database.connect_manually(role, password)` | Credentials passed by the caller (setup, upgrade). |
| `Database.connect_admin()` | The role that owns the `msar` schema, if it is stored as a `ConfiguredRole`. |
| `mathesar/utils/permissions.py` setup functions | The internal database role, for `CREATE DATABASE` and `CREATE USER` on the internal server. |

- Structure and data are read live on every request. Django stores no copy of schemas, tables, or columns.
- Objects are identified by Postgres OID (`table_oid`, `schema_oid`) and column `attnum`. `database_id` is always the Django id.
- Each connection sets `application_name` to `Mathesar <call site>`, visible in `pg_stat_activity`.

## Install flow

| Step | Code | When it runs |
|---|---|---|
| Django tables and static files | `mathesar/install.py`: `migrate`, then `collectstatic` | Every dev container start (`bin/mathesar_dev`). In production, `build-scripts/bin/mathesar.sh` with `--setup-django`, and `build-scripts/install/install.sh`. |
| First superuser | `bin/mathesar_dev` runs `createsuperuser`. Otherwise the `/complete_installation/` form. | "Installation complete" means a superuser exists (`mathesar/views/installation/decorators.py`). |
| Mathesar SQL in a user database | `Database.install_sql` in `mathesar/models/base.py`, which calls `install` in `db/sql/install.py` | On `databases.setup.create_new`, `databases.setup.connect_existing`, `databases.upgrade_sql`, and per-user database setup. Never at server start. |
| SQL removal | `Database.uninstall_sql`, which calls `uninstall` in `db/sql/install.py` | On `databases.configured.disconnect`. |

Gotcha: editing a file in `db/sql/` does not change any running database. Reinstall with `agents/bin/rpc databases.upgrade_sql '{"database_id": 1}'` (the UI action "Reinstall Mathesar Schemas") or reconnect the database. Details in `agents/docs/02-backend/sql.md`.

## Management commands

- One custom command: `mathesar/management/commands/add_readonly_django.py`. It creates a Postgres role on the internal database that can read Django tables but write only sessions and `last_login`. It prompts for a password.
- Standard commands used by scripts: `migrate`, `collectstatic`, `createsuperuser`, `compilemessages`, `makemessages`.

## Sample datasets

- Loader functions live in `mathesar/examples/`, SQL in `mathesar/examples/resources/`.
- `_load_sample_data` in `mathesar/utils/permissions.py` maps API keys to loaders: `bike_shop`, `hardware_store`, `ice_cream_employees`, `library_makerspace`, `library_management`, `movie_rentals`, `museum_exhibits`, `nonprofit_grants`.
- Most loaders use `load_dataset_sql` in `mathesar/examples/base.py`: create a schema, set `search_path`, run the SQL file.
- `_load_sample_data` catches `DuplicateSchema`, so requesting a dataset whose schema already exists does not raise.
- To add a dataset: add the SQL file, a loader module, an entry in `_load_sample_data`, and the key in the docstrings of `mathesar/rpc/databases/setup.py`.

## Import pipeline

New table from CSV or TSV:

1. `POST /api/db/v0/data_files/` with a file or pasted text. `create_datafile` in `mathesar/utils/datafiles.py` detects encoding and CSV dialect (`mathesar/utils/csv.py`) and saves a `DataFile` row.
2. RPC `tables.import` calls `copy_datafile_to_table` in `mathesar/imports/datafile.py`.
3. It cleans header names, turns empty strings into NULL, and calls `create_and_import_from_rows` in `db/tables.py`.
4. `msar.prepare_table_for_import` creates a table with all `text` columns and returns a `COPY ... FROM STDIN` statement. psycopg streams the rows.
5. RPC `data_modeling.suggest_types` (SQL `msar.infer_table_column_data_types`) proposes column types. RPC `tables.get_import_preview` shows rows cast to chosen types. RPC `tables.patch` applies them.

Existing table: `POST /bulk_insert/` copies the file into a temporary table (`msar.prepare_temp_table_for_import`), then `msar.insert_from_select` inserts the mapped columns.

- Allowed delimiters are in `ALLOWED_DELIMITERS` in `mathesar/utils/csv.py`. The user docs repeat that list.
- `DataFile` fields `max_level` and `sheet_index`, and the `URL` choice, are leftovers from removed JSON, Excel, and URL imports.

## File storage

Two unrelated storage systems exist.

| | CSV data files | File attachments (File columns) |
|---|---|---|
| Config | `STORAGES["default"]` in settings: local `MEDIA_ROOT` or Azure | A YAML file at the repo root (copy `file_storage.yml.example` to the same name without the example suffix) or `FILE_STORAGE_DICT` |
| Library | Django storage, `django-storages` | `fsspec` (S3, Azure) |
| Code | `mathesar/utils/datafiles.py` | `mathesar/utils/download_links.py`, `mathesar/views/download_link.py` |

- A column is a file column when its `ColumnMetaData.file_backend` is set. The cell holds JSON with `uri` and `mash`.
- `mash` is a SHA-256 of `SECRET_KEY`, backend key, and URI (`create_mash_for_uri`). It proves the URI was issued by this installation.
- `records.list`, `records.get`, and `records.search` create `DownloadLink` rows tied to the caller's session and return them as `download_links`.
- `/files/<mash>/` serves a link only to a session attached to it.
- Changing `SECRET_KEY` invalidates stored mashes. The superuser RPC method `columns.reset_mash` recomputes them.

## Analytics

- Code: `mathesar/analytics.py`, RPC in `mathesar/rpc/analytics.py`, models in `mathesar/models/analytics.py`.
- Analytics is on when an `InstallationID` row exists. The installation form or `analytics.initialize` creates it. `analytics.disable` deletes it.
- `wire_analytics` wraps every RPC method. At most once per 30 minutes per process it starts a thread running `run_analytics`.
- `run_analytics` saves at most one `AnalyticsReport` per day, posts unsent reports to `MATHESAR_ANALYTICS_URL`, and deletes old ones.
- Counts come from `msar.get_object_counts()` on each connected database.
- The same decorator stack also runs `run_model_maintenance` (expired sessions, orphan download links) on the same schedule.
- Both threads are skipped when `settings.TEST` is true.
