# Build, packaging, release, docs site

How Mathesar is built into images and install packages, how a release is cut, and how the user docs are built. Read this before changing a `Dockerfile`, a compose file, `build-scripts/`, a dependency, a GitHub workflow, or anything under `docs/`.

## Docker images

`Dockerfile` is multi-stage. `PYTHON_VERSION` defaults to `3.14-bookworm`. The build stage installs Node 18.

| Target | Contains | Starts with | Used by |
|---|---|---|---|
| `testing` | Source and `requirements-dev.txt`. No Node, no built front end | `bin/mathesar_dev` | `test-service` in `docker-compose.dev.yml`, `api-test-service` in `docker-compose.test.yml` |
| `development` | Source, dev requirements, Node, `npm ci` | `bin/mathesar_dev` | `dev-service` in `docker-compose.dev.yml` |
| `production` | Packaged app, production requirements, PostgreSQL 17 inside the image | `bin/mathesar run -fnse` | The published image `mathesar/mathesar:latest` |
| `minimal` | Packaged app, no PostgreSQL, non-root user, static files collected at build time | `bin/mathesar run -ne` | Deployments that bring their own database. Does not run migrations at start |

- `bin/mathesar_dev` runs `npm run dev` (only when Node is in the image), `python -m mathesar.install`, `createsuperuser` for `admin`, then `manage.py runserver`.
- The `build_deps` stage runs `compilemessages`. A broken `.po` file in `translations/` fails the image build.
- `.dockerignore` excludes `node_modules` and `dist`.
- `Dockerfile.devdb` adds pgTAP and the PL/pgSQL debugger to the official PostgreSQL image. `PG_VERSION` selects the version.
- `Dockerfile.caddy` and `Caddyfile` build the reverse proxy image `mathesar/mathesar-caddy:latest`.

## Compose files

| File | Purpose | Notes |
|---|---|---|
| `docker-compose.yml` | Production example for users: `service`, `db`, `caddy-reverse-proxy` | Published with each release and referenced from the install docs. Treat changes as user-facing |
| `docker-compose.dev.yml` | Development: `dev-db`, `dev-service`, `obj-store` (MinIO), `test-service` | CI builds `test-service` and `dev-db` from it |
| `docker-compose.test.yml` | Scenario tests: `test-db`, `test-user-db`, `api-test-service`, `test-runner` | Run by `run_api_tests.sh` |

Run the production file with images built from your working tree: `agents/bin/prod up` (`agents/docs/01-setup/production-stack.md`). Do this after any change to the files in this section and the next one.

A new environment variable usually needs four edits: `config/settings/common_settings.py`, `docker-compose.yml`, `docker-compose.dev.yml`, and `docs/docs/administration/environment-variables.md`.

## Non-Docker package

`build-scripts/package/package.py` builds the release archive. CI runs it on every PR (job `package`) and tests the result (job `install`).

1. Downloads the `uv` installer (version pinned in the script).
1. Runs `npm ci` and `npm run build` in `mathesar_ui/`.
1. Installs `requirements.txt` and runs `compilemessages`.
1. Copies the paths in `SOURCE_CONTENTS_TO_COPY` into the archive. A new top-level directory that the app needs at runtime must be added to that list. `agents/`, `docs/` and the `mathesar_ui/` sources are not shipped.
1. Writes `dist/mathesar.tar.gz` and `dist/install.sh`.

Related scripts:

| File | Role |
|---|---|
| `build-scripts/install/install.sh` | The installer users run. Installs `uv` and Python, creates a virtual environment, writes `.env`, runs migrations |
| `build-scripts/bin/mathesar.sh` | Becomes the `mathesar` launcher in the `bin` directory of the package: `mathesar run`, `mathesar version`. Starts gunicorn |
| `build-scripts/common_utilities.sh`, `build-scripts/install/install_utilities.sh`, `build-scripts/install/install_path_handler.sh` | Shared shell functions, inlined into the two scripts at packaging time through `include_source` lines |
| `setup/process_env.py` | Validates the PostgreSQL settings of a `.env` file for the installer |

ShellCheck runs on `build-scripts/` and `bin/` in CI (`.github/workflows/line-sh-files.yml`). The scripts must work in bash on Linux and macOS.

## Dependencies

- Python: exact pins in `requirements.txt` (runtime) and `requirements-dev.txt` (tests, lint, docs preview). No lock file. Supported Python versions are 3.10 to 3.14, so a new pin must install on all of them.
- Front end: `mathesar_ui/package.json` with `mathesar_ui/package-lock.json`. Use `npm ci`. Change the lock file only when you add or update a package on purpose.
- Docs: `docs/requirements.txt`.
- Dependabot opens update PRs. Maintainers often bundle them into one PR.
- A change to a requirements file triggers the full backend CI matrix.

## Version

The version string lives in two places: `__version__` in `mathesar/__init__.py` and `mathesar_version` in `docs/mkdocs.yml`. The first is compared with each connected database's `last_confirmed_sql_version` to prompt a SQL upgrade.

Do not bump the version, create tags, or edit release notes in a feature PR. Maintainers do that when cutting a release.

## Release process

Maintainers follow `https://wiki.mathesar.org/release/`. In outline:

1. Cut `release-X.Y.Z` from `develop`. Bump the version in the two places above.
1. Write release notes as a new file in `docs/docs/releases/` (like `docs/docs/releases/0.12.0.md`) with `docs/docs/releases/find_missing_prs.sh` (see `docs/docs/releases/README.md`). Add the file to the `nav` in `docs/mkdocs.yml`.
1. Build and push test images. Manual QA of install, upgrade and the main features.
1. Merge the release PR into `master`. Push the tag. `.github/workflows/create-draft-release.yml` packages the app and creates a draft GitHub release.
1. Publish images and the docs. `.github/workflows/automate-pr-to-develop.yml` opens the PR that merges `master` back into `develop`.

What a feature PR owes the release: upgrade safety. Django changes need a migration. SQL changes must reinstall cleanly over the previous release (see "Upgrades and removal of old objects" in `agents/docs/02-backend/sql.md`). Dropping support for a Python or PostgreSQL version happens only in a minor release and is recorded in `docs/docs/administration/version-support.md`.

## User docs site

Source: `docs/`. Human guide: `docs/README.md`. Style guide: `docs/STYLE_GUIDE.md`.

| Item | Location |
|---|---|
| Pages | `docs/docs/` (`administration/`, `user-guide/`, `api/`, `releases/`) |
| Navigation and plugins | `docs/mkdocs.yml`. A new page must be added to `nav` |
| Reusable fragments | `docs/docs/snippets/` |
| Theme overrides | `docs/overrides/` |
| API reference | `docs/docs/api/methods.md`, rendered from the docstrings in `mathesar/rpc/` by mkdocstrings. A method must be listed there to appear |

Build check, as CI runs it (`.github/workflows/test-docs.yml`):

```
agents/bin/check docs      # creates docs/.venv on first run, then: mkdocs build --strict
```

- `--strict` turns warnings into failures, for example a broken internal link.
- The site is published from `master` with `mike` (versioned docs) to the `gh-pages` branch. Publication is manual.
- Docs for an unreleased feature go to `develop` with the feature. A fix for the current release goes to `master`.

## Translations

Process: `DEVELOPER_GUIDE.md`, sections "Internationalization" and "Translation process". For agents: edit only the English sources (`mathesar_ui/src/i18n/languages/en/dict.json`, and `translations/en/LC_MESSAGES/django.po` through `makemessages`). Transifex opens PRs for the other languages.

## GitHub workflows

Listed in `agents/docs/00-general/repo-map.md`. Two rules:

- A new test or lint job in `.github/workflows/test-and-lint-code.yml` must be added to the `needs` list and the checks of the `checkpoint` job. Otherwise branch protection does not require it.
- Any `.yml` or `.sh` change triggers every backend job. Expect about 100 matrix jobs.
- The build, packaging and install jobs are skipped on a pull request that changes only paths in `.github/build-skip-paths.txt`. That list holds folders and exact file names, never file types. CI fails if an entry overlaps a path that `build-scripts/package/package.py` packages or a Dockerfile copies. When the package starts to include a file or folder from the list, remove it from the list in the same PR.
