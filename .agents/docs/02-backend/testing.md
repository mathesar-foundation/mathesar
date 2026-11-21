# Backend testing

The four backend test suites, what each one exercises, the pytest configuration and fixtures, the CI matrix, and the commands.
Read this before writing or running backend tests, and when a green pytest run needs to be interpreted.
Human docs with the Docker commands: `DEVELOPER_GUIDE.md` (section "Running backend tests") and `db/sql/README.md` (section "Testing").

## The suites

| Suite | Location | Runner | Executes real `msar` SQL |
|---|---|---|---|
| Python unit tests | `mathesar/tests/`, `db/tests/` | pytest | Mostly no. See below. |
| SQL tests | `db/sql/test_sql_functions.sql` | pgTAP through `db/sql/run_tests.sh` | Yes |
| Scenario tests | `api_tests/test_happy_db_setups.py` | pytest in its own container, over HTTP | Yes, through the whole stack |
| Config parser tests | `config/tests/`, `setup/tests/` | pytest, only when named explicitly | No |

What catches what:

| Change | Caught by |
|---|---|
| Wrong logic inside an SQL function | pgTAP only |
| SQL function renamed, or parameter count changed, without updating the wrapper | `db/tests/wrapper/test_exec_wrappers.py` |
| SQL function returns a different JSON shape | Scenario tests, if that method is in the scenario. Otherwise nothing. |
| RPC method added, renamed, or auth level changed without updating the list | `mathesar/tests/rpc/test_endpoints.py` |
| RPC function passes arguments to the wrapper in the wrong order | The RPC unit test of that method, if it asserts on `call_args` |
| Object missing from the SQL registry file | The disconnect step of the scenario tests, and `.agents/bin/check sql-registry`. |
| Failure only on upgrade from the last release (migrations, SQL reinstall over old functions) | No automated test. Run the upgrade test in `.agents/docs/01-setup/production-stack.md`. |
| Failure only in the packaged production image | CI job `build_tests` covers the build only. Run `.agents/bin/prod up` and exercise the change. |
| Exploration query building | `db/tests/deprecated/` |

Consequence: a passing `pytest` run says little about SQL behavior. After changing SQL, run the pgTAP suite. After changing a cross-layer contract, also run the scenario tests (`.agents/bin/check api-tests`).

## pytest configuration

Configured in `setup.cfg`, section `[tool:pytest]`. Plugins come from `requirements-dev.txt`: `pytest-django`, `pytest-env`, `pytest-xdist`, `pytest-cov`, `responses`.

| Setting | Value | Effect |
|---|---|---|
| `testpaths` | `db`, `mathesar` | A bare `pytest` collects only these. `config/tests/` and `setup/tests/` are skipped unless passed as arguments. |
| `DJANGO_SETTINGS_MODULE` | `config.settings.production` | Tests run with production settings. |
| `env` | `TEST=True`, `MODE=PRODUCTION`, forced. `ALLOWED_HOSTS`, `DEBUG`, `SECRET_KEY` only as defaults (prefix `D:`). | `settings.TEST` turns off the analytics and maintenance threads. |
| `addopts` | `--color=auto --no-header --disable-warnings -n auto` | Tests run in parallel with xdist by default. Warnings are hidden. |

- `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_HOST` (and password, port) are not set by `setup.cfg`. They must be in the environment.
- Every pytest session needs a reachable PostgreSQL server, even for a single pure-Python test. Two autouse fixtures connect to it (next section).
- The Postgres role needs `CREATEDB`. pytest-django creates its test database, and the root conftest creates one more per xdist worker.
- Mathesar SQL is installed into that extra database at session start. A syntax error anywhere in `db/sql/` makes every test error during setup.
- Use `-n 0` to run in one process, for example when using a debugger.
- Run pytest from the repo root. Some tests use relative paths (`db/`, `mathesar/tests/data/`).
- Tests that create `DataFile` rows write files into the media directory (`MEDIA_ROOT`, by default a git-ignored directory at the repo root).

## Fixtures in the root `conftest.py`

This file applies to every test in the repo. It depends on SQLAlchemy and `sqlalchemy_utils`.

| Fixture | Scope | Purpose |
|---|---|---|
| `disable_http_requests` | function, autouse | Patches `urllib3` so any real outbound HTTP request raises. Use `mocked_responses` to fake one. |
| `test_db_name` | session, autouse | Creates database `mathesar_db_test_<worker_id>` with Mathesar SQL installed. Returns its name. |
| `create_db` | session | Factory behind `test_db_name`. Drops a leftover database of the same name first, installs SQL through `install` in `db/sql/install.py`, drops the database at session end. |
| `engine_cache` | session | Factory returning one SQLAlchemy engine per database name. |
| `engine` | session | Engine for the test database, with Mathesar custom types registered. |
| `worker_id`, `get_uid`, `uid` | session, session, function | xdist worker name and unique short strings for object names. |
| `create_db_schema`, `engine_with_schema` | function | Create a schema (default name `_test_schema_name`) and drop it with `CASCADE` after the test. |
| `engine_with_academics`, `academics_db_tables` | function | Load `db/tests/deprecated/resources/academics_create.sql` into the test schema. |
| `engine_with_library`, `library_db_tables` | function | Load the library dataset from `db/tests/deprecated/resources/`. |

- Connection parameters for these engines are copied from Django's default database settings (`_create_engine`). The test database lives on the same server as the internal database.
- Engines set `timezone=utc` and `lc_monetary=en_US.UTF-8`.
- To get a psycopg connection to the test database, use `engine_to_psycopg_conn(engine)` from `db/deprecated/utils.py`, as `db/tests/wrapper/test_exec_wrappers.py` does.
- More fixtures for the SQLAlchemy tests are in `db/tests/deprecated/conftest.py`.

## Fixtures in `mathesar/tests/conftest.py`

| Fixture | Scope | Purpose |
|---|---|---|
| `enable_db_access_for_all_tests` | function, autouse | Requests pytest-django `db`. Every test under `mathesar/tests/` may use the ORM and is rolled back. |
| `always_authorized` | function, autouse | Patches `UserDatabaseRoleMap.objects.get` to return a dummy object. This bypasses `ensure_db_authorization`. |
| `mocked_exec_msar_func` | function | Patches `db.connection.exec_msar_func`. The mock returns itself, so set `mocked_exec_msar_func.fetchone.return_value`. |
| `mocked_select_from_msar_func` | function | Same for `select_from_msar_func`. |
| `mocked_responses` | function | `responses.RequestsMock` for code that uses `requests`. |
| `ignore_all_dbs_except_default`, `dj_databases` | session | Keep only the `default` entry in `settings.DATABASES`. |
| `user_alice`, `user_bob` | function | Saved standard users, password `password`. |
| `client`, `client_alice`, `anonymous_client` | function | Django test clients: admin (uses pytest-django `admin_user`), alice, not logged in. |
| `patents_csv_filepath` and similar | session | Paths to sample files in `mathesar/tests/data/`. |

Side effect of `always_authorized`: code under test that calls `UserDatabaseRoleMap.objects.get(...)` receives a bare `object()`, not a model. Patch around it when a test needs a real map row.

## How RPC method tests are written

Location: `mathesar/tests/rpc/`. Roughly one file per RPC module. `columns` and `tables` have subdirectories (for example `mathesar/tests/rpc/tables/test_t_base.py`).
Not every module has a file. `mathesar/rpc/schemas/base.py`, `mathesar/rpc/collaborators.py`, and `mathesar/rpc/servers/configured.py` have no dedicated unit tests.

The pattern, as in `mathesar/tests/rpc/test_records.py`:

1. Build a request with pytest-django `rf`: `request = rf.post('/api/rpc/v0/', data={})`. Attach an unsaved user: `request.user = User(username='alice', password='pass1234')`.
2. Replace `connect` in the RPC module with a context manager that checks its arguments and yields a dummy: `monkeypatch.setattr(records, 'connect', mock_connect)`.
3. Set the fake SQL result: `mocked_exec_msar_func.fetchone.return_value = [expected]`.
4. Call the Python function directly with keyword arguments plus `request=request`.
5. Assert on the return value and on `mocked_exec_msar_func.call_args_list[0][0]`. Index 0 is the connection, index 1 the SQL function name, index 2 onward the SQL arguments.

- For package namespaces, patch the submodule that imported `connect`: `tables.base`, not `tables`.
- Direct calls skip the library auth predicate. Auth levels are tested only in `mathesar/tests/rpc/test_endpoints.py`.
- Methods that only use Django models are tested by monkeypatching the helper from `mathesar/utils/` (see `mathesar/tests/rpc/test_users.py`) or by using the ORM.
- Each test file starts with a docstring listing the fixtures it uses. Keep that habit.
- `mathesar/tests/rpc/test_endpoints.py` holds the `METHODS` list. `test_rpc_endpoint_expected_methods` posts `system.listMethods` to a `live_server` and compares names. `test_correctly_exposed` checks each function's decorator attributes.
- `mathesar/tests/rpc/exceptions/` tests error code mapping and the exception wrapper.

Other pytest areas:

| Path | Content |
|---|---|
| `mathesar/tests/api/test_data_file_api.py` | The data file HTTP endpoints, through the Django test client. |
| `mathesar/tests/views/` | Home, login, and 404 views. |
| `mathesar/tests/imports/` | CSV dialect detection and `copy_datafile_to_table`, with the database call replaced. |
| `mathesar/tests/utils/` | Download links, user display helpers. |
| `mathesar/tests/config/` | Settings behavior. These spawn a subprocess that imports settings with a modified environment. |
| `mathesar/tests/test_analytics.py`, `mathesar/tests/test_health_check_middleware.py` | Analytics and health checks. |
| `db/tests/` | See `.agents/docs/02-backend/db-python.md`. |

## Which tests touch which database

| Tests | Internal Django test database | `mathesar_db_test_<worker_id>` |
|---|---|---|
| `mathesar/tests/` | Yes (ORM, rolled back per test) | Created, but not queried |
| `db/tests/test_columns.py`, `db/tests/test_roles.py`, `db/tests/test_tables.py` | No | Created, but not queried |
| `db/tests/wrapper/test_exec_wrappers.py` | No | Reads `pg_proc` |
| `db/tests/deprecated/` | No | Creates schemas and tables, runs queries |

## SQL tests

Structure, conventions, and how to select tests are in `.agents/docs/02-backend/sql.md`, section "pgTAP tests". In short: the runner builds a fresh database `mathesar_testing`, installs all SQL, runs every `test*` function, and drops the database.

## Scenario tests in `api_tests/`

- One module, `api_tests/test_happy_db_setups.py`, with 24 tests. It uses `requests` against a running Mathesar service.
- Tests are ordered steps of one story and share state through module-level globals. Running a subset with `-k` breaks later steps.
- The story: connect an internal and an external database with sample data, reinstall SQL, add a user and a Postgres role, add a collaborator, grant privileges step by step while checking what the user can see, delete a schema, disconnect.
- Login is done through the HTML form with a CSRF token. Fixtures `admin_rpc_call` and `intern_rpc_call` post JSON-RPC and return `response['result']`, so an RPC error fails the test with `KeyError`.
- The stack is defined in `docker-compose.test.yml`: `test-db` (internal database), `test-user-db` (external database `my_data`, role `data_admin`), `api-test-service` (the app, started by `bin/mathesar_dev`), `test-runner`.
- The runner image is built from `api_tests/` alone (`api_tests/Dockerfile`, `api_tests/requirements.txt`). The root `conftest.py` and `setup.cfg` do not apply to it.
- `run_api_tests.sh` runs the module and then removes the containers and volumes.
- These are the only tests that run real RPC calls against real SQL. Add a step here when a change spans SQL, wrapper, and RPC.

## CI

Workflow: `.github/workflows/test-and-lint-code.yml`. Jobs run only when matching files changed.

| Job | Matrix | Command | Triggered by changes to |
|---|---|---|---|
| `python_tests` | Python 3.10 to 3.14, PostgreSQL 14 to 18, connection by host name and by Unix socket | `docker exec mathesar_service_test ./run_pytest.sh` | Python files at the repo root, anything under `mathesar/` or `db/`, requirements files |
| `sql_tests` | PostgreSQL 14 to 18 | `docker exec mathesar_dev_db /bin/bash /sql/run_tests.sh` | Any SQL file |
| `api_tests` | Python 3.10 to 3.14, PostgreSQL 14 to 18, two `init-db-args` values (see note) | `sh run_api_tests.sh` | Same as `python_tests` |
| `python_lint` | None | flake8 on the whole repo | Any Python file, requirements files |
| `vulture` | None | `vulture .` (config in `pyproject.toml`) | Same as `python_lint` |

- Changes to any YAML file, shell script, or Dockerfile trigger all backend jobs.
- Note on `init-db-args`: the job exports `POSTGRES_INITDB_ARGS`, but no compose file passes that variable to a database container. Both matrix values appear to run the same configuration.
- `run_pytest.sh` runs `pytest`, then runs the failed tests once more with `--last-failed`. The second run decides the exit code.
- `python_tests` builds the stack with `docker compose -f docker-compose.dev.yml up --build -d test-service dev-db`.
- A change only under `config/` or `setup/` does not trigger `python_tests`, and their test directories are outside `testpaths`. CI never runs them. `.agents/bin/check python-tests` includes them.
- flake8 settings: `setup.cfg` ignores `E501`, `W503`, `W505`. `lint.sh` is described in `DEVELOPER_GUIDE.md`.
- vulture runs at 90 percent confidence. Unused code below that threshold is not reported.

## Commands (native setup)

Verified on Ubuntu 24.04, PostgreSQL 16, Python 3.13. One-time setup: `.agents/bin/setup --sql-tests`. Only `api-tests` needs Docker.

| Command | Runs | Time |
|---|---|---|
| `.agents/bin/check` | The suites that match your changed files, by the CI path rules | Varies |
| `.agents/bin/check python-tests` | `pytest db mathesar config/tests setup/tests` (811 tests) | 21 s |
| `.agents/bin/check python-tests -- -k test_name` | pytest with your arguments. It then collects from `db` and `mathesar` only (`testpaths` in `setup.cfg`). Name the path for a test under `config/tests` or `setup/tests` | Seconds |
| `.agents/bin/check python-tests -- -n 0 mathesar/tests/rpc/test_records.py` | One file, one process | 1 s |
| `.agents/bin/check sql-tests` | All pgTAP tests (199 test functions) | 5 s |
| `.agents/bin/check sql-tests -- -x foo_bar` | pgTAP tests whose names contain `foo_bar` | 1 s |
| `.agents/bin/check sql-registry` | Installs the SQL into a scratch database and fails on objects missing from `db/sql/00_msar_all_objects_table.sql` | 1 s |
| `.agents/bin/check python-lint` | flake8 and vulture, excluding `.venv` and `node_modules` | 1 s |
| `.agents/bin/check api-tests` | The scenario tests (24 steps) against the Docker stack in `docker-compose.test.yml` | 2 min |

- The runner sources `.agents/bin/dev-env`, so the `POSTGRES_*` variables are set. To call pytest directly: `source .agents/bin/dev-env && .venv/bin/pytest ...`.
- `db/sql/run_tests.sh` hardcodes the role name `mathesar`. The runner passes host and password through `PGHOST` and `PGPASSWORD`.
- `api-tests` builds the two test images from the working tree, then runs `run_api_tests.sh` unchanged. It starts the Docker daemon if it can. Without Docker the suite is reported as skipped. Then cover the same ground by hand with `.agents/bin/rpc` (see `.agents/docs/01-setup/drive-the-app.md`) and rely on CI for the scenario run.
- The scenario stack runs the app from the working tree with `runserver`. It is not the production setup. For that, see `.agents/docs/01-setup/production-stack.md`.
- CI runs the Python and SQL suites on every supported PostgreSQL and Python version. A native run covers one combination.

## Commands (Docker)

Start the dev stack first (`DEVELOPER_GUIDE.md`, section "Local development setup").

```
# All Python tests
docker exec mathesar_service_dev pytest mathesar/ db/

# One Python test by name
docker exec mathesar_service_dev pytest -k "test_name"

# All SQL tests
docker exec mathesar_dev_db /bin/bash /sql/run_tests.sh -v

# SQL tests whose names contain foo_bar
docker exec mathesar_dev_db /bin/bash /sql/run_tests.sh -v -x foo_bar

# Scenario tests (builds and removes its own containers)
./run_api_tests.sh
```
