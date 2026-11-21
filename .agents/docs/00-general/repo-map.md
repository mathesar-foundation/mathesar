# Repository map

Every top-level entry of the repo with its purpose, and which doc covers it. Read this to find where something lives, or to check that a change belongs where you are about to put it.

File counts are from November 2026 and show relative size only.

## Source code

| Path | Files | What it is | Doc |
|---|---|---|---|
| `mathesar_ui/` | 1214 | Front end: Svelte 3, TypeScript, Vite | `.agents/docs/03-frontend/overview.md` |
| `mathesar/` | 195 | The Django app: RPC methods, models, views, templates, sample datasets | `.agents/docs/02-backend/overview.md` |
| `db/` | 98 | psycopg wrappers (`db/*.py`), SQL functions and their tests (`db/sql/`), SQLAlchemy code for explorations (`db/deprecated/`) | `.agents/docs/02-backend/sql.md`, `.agents/docs/02-backend/db-python.md` |
| `config/` | 15 | Django settings, root URLconf, parsers for SSO and login page config | `.agents/docs/02-backend/overview.md` |
| `setup/` | 3 | `setup/process_env.py`, used only by the install script | `.agents/docs/05-ops/build-release.md` |
| `manage.py` | 1 | Django CLI | |
| `conftest.py` | 1 | Root pytest fixtures (test database with Mathesar SQL installed) | `.agents/docs/02-backend/testing.md` |
| `api_tests/` | 3 | Scenario tests that run over HTTP against a Docker stack | `.agents/docs/02-backend/testing.md` |
| `translations/` | 4 | Django gettext files, one folder per language. Only `translations/en/` is edited by hand | `DEVELOPER_GUIDE.md` |

## Build, run, deploy

| Path | What it is |
|---|---|
| `Dockerfile` | Multi-stage image: `testing`, `development`, `production`, `minimal` |
| `Dockerfile.devdb` | Dev PostgreSQL image with pgTAP |
| `Dockerfile.caddy`, `Caddyfile` | Reverse proxy image used by `docker-compose.yml` |
| `docker-compose.yml` | Production example stack. Shipped to users |
| `docker-compose.dev.yml` | Development stack: `dev-service`, `dev-db`, `obj-store`, `test-service` |
| `docker-compose.test.yml` | Stack for `api_tests/` |
| `bin/mathesar_dev` | Entry point of the dev and test containers |
| `build-scripts/` | Packaging script, install script, and the `mathesar` launcher for non-Docker installs |
| `.env.example` | Example for the `.env` file that `docker compose` reads. Django does not read `.env` |
| `file_storage.yml.example`, `sso.yml.example`, `login_page.yml.example` | Examples for optional config files at the repo root |
| `requirements.txt`, `requirements-dev.txt` | Pinned Python dependencies |
| `pyproject.toml` | Settings for `uv` and `vulture` only. The repo is not a Python package |
| `setup.cfg`, `.flake8` | pytest and flake8 settings |
| `lint.sh` | Runs flake8 and ESLint on staged changes. Optional pre-commit hook |
| `run_pytest.sh`, `run_api_tests.sh` | Test entry points used by CI |

Covered in `.agents/docs/05-ops/build-release.md`.

## Documentation

| Path | Audience | What it is |
|---|---|---|
| `README.md` | Everyone | Product pitch and screenshots |
| `CONTRIBUTING.md` | Contributors | Issue and PR process |
| `DEVELOPER_GUIDE.md` | Contributors | Docker dev setup, tests, i18n and translation process |
| `mathesar_ui/README.md`, `mathesar_ui/ARCHITECTURE.md`, `mathesar_ui/STANDARDS.md` | Front end contributors | Setup, store patterns, code standards |
| `db/sql/README.md`, `db/sql/STANDARDS.md` | SQL contributors | Schemas, tests, naming rules |
| `docs/` | Users and administrators | Source of `https://docs.mathesar.org` (MkDocs). 161 files. Includes release notes in `docs/docs/releases/` |
| `AGENTS.md`, `.agents/` | Coding agents | This map, setup scripts, checks |
| `SECURITY.md` | Reporters | How to report a vulnerability |
| `TROUBLESHOOTING.md` | Users | How to search for and report a problem |
| `assets/` | | Images for `README.md` |

## Project automation

| Path | What it is |
|---|---|
| `.github/workflows/test-and-lint-code.yml` | All test, lint and build jobs. Ends in the required `checkpoint` job |
| `.github/workflows/test-docs.yml` | `mkdocs build --strict` when `docs/` changes |
| `.github/workflows/line-sh-files.yml` | ShellCheck on `build-scripts/` and `bin/` |
| `.github/workflows/create-draft-release.yml` | On a tag: package and create a draft GitHub release |
| `.github/workflows/automate-pr-to-develop.yml` | After a push to `master`: open a PR back into `develop` |
| `.github/workflows/codeql-analysis.yml` | CodeQL for Python and JavaScript |
| `.github/workflows/sync-github-labels-milestones.yml`, `.github/workflows/sync-workflows.yml` | Copy labels, milestones and some workflow files to other repos of the organization |
| `.github/ISSUE_TEMPLATE/`, `.github/PULL_REQUEST_TEMPLATE` | Issue templates and the PR template |
| `.tx/` | Transifex configuration |
| `LICENSE`, `LICENSES/`, `THIRDPARTY` | GPLv3 and third-party notices |

## Created at runtime, never committed

| Path | Created by |
|---|---|
| `.venv/`, `mathesar_ui/node_modules/` | `.agents/bin/setup` |
| `.secrets/` | Django, on first start without `SECRET_KEY` |
| `.media/` | CSV uploads |
| `mathesar/static/mathesar/` | `npm run build` |
| `static/` | `collectstatic` in production mode. Not in `.gitignore`: do not commit it |
| `file_storage.yml`, `sso.yml`, `login_page.yml`, `.env` | You, from the example files |

## Other repositories

| Repository | Content |
|---|---|
| `mathesar-foundation/mathesar-wiki` | Source of `https://wiki.mathesar.org` (process, product specs) |
| `mathesar-foundation/mathesar-data-playground` | Sample datasets, including larger ones |
| `mathesar-foundation/mathesar-scripts` | Maintainer scripts, including the generator for the SQL object registry |
| `mathesar-foundation/mathesar-website` | Source of `https://mathesar.org` |
