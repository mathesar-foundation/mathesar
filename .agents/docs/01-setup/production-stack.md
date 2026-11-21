# Run the production Docker Compose setup

How to run `docker-compose.yml`, the setup most users deploy, with images built from your working tree. Read this when a change could behave differently outside the dev servers, and before any change to the build, packaging, settings, dependencies or the reverse proxy. For daily work use the faster native setup in [install-sandbox.md](./install-sandbox.md).

## Commands

```
.agents/bin/prod up                    # build both images from the working tree, start, create admin / password
.agents/bin/prod up --no-admin         # same, but leave the first-run installation page in place
.agents/bin/prod up --release 0.12.0   # run the published images of a release instead of building
.agents/bin/prod status
.agents/bin/prod logs service          # also: db, caddy-reverse-proxy
.agents/bin/prod down                  # stop, keep the data
.agents/bin/prod reset                 # stop and delete the data
```

The app is served at `http://localhost` (port 80). The other scripts work against it:

```
export MATHESAR_URL=http://localhost
.agents/bin/seed
.agents/bin/rpc databases.configured.list
.agents/bin/screenshot /db/1/schemas/ /tmp/prod-schemas.png
```

It runs next to the native dev servers. They use ports 8000, 3000 and 5432. The stack uses 80 and 443.

The stack has a known admin password, so the script publishes its ports on `127.0.0.1` only. Use Docker Engine 28 or later on a machine that shares a network with others: the Docker documentation says that in older releases, hosts on the same network segment can reach ports published to localhost.

Verified in a sandbox (Ubuntu 24.04, Docker 29, 4 cores): `up` takes 4 to 5 minutes, of which the build is about 3.5 minutes. With `--release` it takes about 40 seconds. Any file change rebuilds most of the image, because `Dockerfile` copies the whole tree before installing dependencies.

## What `up` does

1. Starts the Docker daemon if `dockerd` is installed but not running.
1. Builds `mathesar/mathesar:agents-local` (target `production` of `Dockerfile`) and `mathesar/mathesar-caddy:agents-local` (`Dockerfile.caddy`). The build context is what git would commit: tracked files plus new files that are not ignored. Uncommitted edits are included. `.venv` and other ignored files are not.
1. Writes a Compose override next to the data that swaps in those images. `docker-compose.yml` itself is used unchanged.
1. Runs `docker compose up` and waits until the service is healthy.
1. Creates the Mathesar user `admin` with password `password`, unless `--no-admin` is given.

Data (PostgreSQL files, static files, media, secret key, Caddy state) lives in `/tmp/mathesar-prod/msar/`, not in the repo. Change the location with `MATHESAR_PROD_DIR`.

## What differs from the dev servers

| | Dev servers (`.agents/bin/start`) | Production stack (`.agents/bin/prod up`) |
|---|---|---|
| Django settings | `config.settings.development`, `DEBUG=True` | `config.settings.production`, `DEBUG=false` |
| Front end | Source modules from Vite on port 3000 | Built bundle with hashed names, plus the legacy bundle and one bundle per language |
| Static and media files | Django | Caddy, from a volume that `collectstatic` fills at container start |
| App server | `runserver`, one process, reloads on change | gunicorn with 3 worker processes (`WEB_CONCURRENCY`) |
| Entry point | Port 8000, direct | Port 80, through Caddy as reverse proxy |
| Code that runs | The working tree | The package: only the paths in `SOURCE_CONTENTS_TO_COPY` of `build-scripts/package/package.py` |
| Python, PostgreSQL | Whatever the host has | Python 3.14, PostgreSQL 17 |
| Django translations | Not compiled | Compiled during the build |
| First visit | `admin` exists | Installation page, unless the script created `admin` |
| Unknown URL | Django debug page | App shell with status 404 |
| Database from the host | `psql -h localhost` | Not exposed. Use `docker exec` (below) |
| Analytics URLs | `example.com` | Real URLs, hardcoded in `config/settings/production.py` |

Problems that only this setup shows:

- A file the app needs at runtime is missing from the package.
- The production build of the front end fails or behaves differently (missing manifest entry, a language bundle, legacy browsers).
- A static or media URL works through Django and not through Caddy.
- State kept in process memory (Django's default cache, module globals) differs between the 3 workers.
- Code depends on `DEBUG`, on development settings, or on a newer or older Python or PostgreSQL than the image has.
- A dependency is in `requirements-dev.txt` and missing from `requirements.txt`.
- A redirect, cookie or CSRF check breaks behind the reverse proxy.
- An upgrade from the last release fails (next section).

## Test an upgrade from the last release

```
.agents/bin/prod reset
.agents/bin/prod up --release 0.12.0     # last release, fresh data
export MATHESAR_URL=http://localhost
.agents/bin/seed                          # create data with the old version
.agents/bin/prod up                       # same data, images from your working tree
.agents/bin/rpc databases.upgrade_sql '{"database_id": 1}'
```

- The second `up` runs your Django migrations on the old internal database at container start. A failure shows in `.agents/bin/prod logs service`.
- `databases.upgrade_sql` reinstalls your SQL functions over the ones the release installed. This is the path that fails when an object is missing from `db/sql/00_msar_all_objects_table.sql`.
- The UI asks an admin to upgrade only when the version string differs. On `develop` the version equals the last release, so call the method yourself.
- With `--release`, the images are the release and `docker-compose.yml` is still the one in your working tree.

The last release is the newest file in `docs/docs/releases/`. Published image tags have no `v` prefix.

## First-run page

`.agents/bin/prod up --no-admin` on a stack with no data leaves it as a new user finds it. `--no-admin` only skips creating the user, so if the stack already has one, run `.agents/bin/prod reset` first. That deletes the stack's data. On the fresh stack, every URL leads to `/complete_installation/`. The form applies Django's password validators, so `password` is rejected there.

The form has two boxes that are ticked by default: a one-time installation report and usage data collection. Untick both when you drive this page. The script also maps `analytics.mathesar.dev` to `127.0.0.1` inside the service container, so a test stack cannot report to the project's real analytics server.

## Look inside

```
.agents/bin/prod logs service                                   # gunicorn and Django output, tracebacks
docker exec mathesar_db psql -U mathesar -d mathesar_django    # internal database
docker exec mathesar_db psql -U mathesar -d sandbox            # a database created by .agents/bin/seed
docker exec mathesar_service python manage.py shell
docker exec mathesar_service ls /code                          # what the package contains
```

Container names are fixed by `docker-compose.yml`: `mathesar_service`, `mathesar_db`. Only one such stack can run on a machine.

## Settings for the stack

`docker compose` substitutes environment variables into `docker-compose.yml` (`DOMAIN_NAME`, `WEB_CONCURRENCY`, `PER_USER_DATABASES_ENABLED`, `SSO_CONFIG_DICT` and others). Export them before `.agents/bin/prod up`.

The script removes the variables of the native dev setup first (`POSTGRES_*`, `DEBUG`, `MODE`, `ALLOWED_HOSTS`, `DJANGO_SETTINGS_MODULE`, `SKIP_STATIC_COLLECTION`), because a shell that sourced `.agents/bin/dev-env` would otherwise point the stack at `localhost` with `DEBUG=True`. To set one of those for the stack, write it to a file named `.env` in the data directory (`/tmp/mathesar-prod/`). `.agents/bin/prod reset` keeps that file.

HTTPS: with the default `DOMAIN_NAME` of `http://localhost`, Caddy serves plain HTTP only.

## Behind a proxy that re-signs TLS

Some sandboxes route HTTPS through a proxy with its own certificate authority. Build steps inside containers then fail certificate checks. When `HTTPS_PROXY` is set and `SSL_CERT_FILE` (or `MATHESAR_BUILD_CA_BUNDLE`) points to a CA bundle, the script:

- builds a local base image from the Python image that trusts that bundle, and passes it to the unchanged `Dockerfile` through its `PYTHON_VERSION` argument,
- builds with host networking and passes the proxy as a build argument.

The images then contain that CA and five variables that point at the system CA store. Nothing else differs. Running containers get no proxy settings, so the app has no outbound HTTPS in such a sandbox.

`.agents/bin/check api-tests` builds its images the same way.

## Problems

| Symptom | Cause | Fix |
|---|---|---|
| `the service image build failed` | A build step failed. The last lines are printed. | Read `/tmp/mathesar-prod/build-service.log`. A failure here is often the finding you ran the stack for. |
| `the stack did not become healthy` | The service exits at start, usually a migration or import error. | `.agents/bin/prod logs service`. |
| Port 80 or 443 is in use | Another web server runs on the host. | Stop it. The ports are fixed in `docker-compose.yml`. |
| `docker compose` rejects `!override` | Docker Compose is older than 2.24. | Upgrade it. The script uses `!override` to publish the ports on `127.0.0.1` only, because the stack has a known admin password. |
| Changes do not show up | The stack runs the image, not the working tree. | `.agents/bin/prod up` again. |
| Console shows a 403 from `api.github.com` | The admin pages look up the latest release. Sandboxes often block or rate limit that. | Ignore. |
| `cannot connect to the Docker daemon` and no `dockerd` | Docker is not installed in this sandbox. | Use the native setup. Say in your report that the production stack was not run. |
