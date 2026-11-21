# Install Mathesar in a sandbox

How to get a running Mathesar from this checkout, with or without Docker. Read this before your first run in a new sandbox, and when a setup script fails.

## Pick a path

| Goal | Use | Why |
|---|---|---|
| Develop and test a change | [Native path](#native-path) | Fastest. Runs on the host with a local PostgreSQL, no Docker. Verified on Ubuntu 24.04. |
| Check a change in the setup users deploy | [production-stack.md](./production-stack.md) | Runs `docker-compose.yml` with images built from your working tree. Needs Docker. |
| Use the same dev stack as the human guide | [Docker path](#docker-path) | PostgreSQL 17, Python 3.14, Node 18 in containers. Not verified in a sandbox. |

The two dev paths serve the app at `http://localhost:8000` with user `admin` and password `password`. The scripts `agents/bin/rpc`, `agents/bin/seed` and `agents/bin/screenshot` work with every path.

Docker in a sandbox: the client can be installed while the daemon is not running. `agents/bin/prod` and `agents/bin/check api-tests` start `dockerd` themselves when they can.

## Native path

```
agents/bin/setup            # install everything, safe to re-run
agents/bin/start            # start Vite (port 3000) and Django (port 8000) in the background
agents/bin/seed             # create a database with sample data, prints its id
agents/bin/stop             # stop both servers
```

`agents/bin/setup` does these steps, and skips the ones already done:

1. Checks for Python 3.10 to 3.14, Node.js, npm, curl.
1. Installs PostgreSQL with `apt-get` if `psql` is missing. Starts the local cluster if it is down.
1. Creates the superuser role `mathesar` (password `mathesar`) and the database `mathesar_django`.
1. Creates `.venv` and installs `requirements-dev.txt` plus `vulture`. Uses `uv` when present, else `python3 -m venv` and pip.
1. Runs `npm ci` in `mathesar_ui/`.
1. Runs `python -m mathesar.install` (Django migrations for the internal database).
1. Creates the Mathesar admin user `admin`.

Add `--sql-tests` to also install pgTAP and `pg_prove`, which `agents/bin/check sql-tests` needs.

Verified on Ubuntu 24.04 with PostgreSQL 16, Python 3.13 and Node 22: setup takes about 15 seconds with warm package caches, `agents/bin/start` about 2 seconds. The first page load after a start takes 10 to 20 seconds while Vite compiles.

### What the native path leaves on disk

| Path | Content | Tracked by git |
|---|---|---|
| `.venv/` | Python virtual environment | No (ignored) |
| `mathesar_ui/node_modules/` | Front end dependencies | No (ignored) |
| `.secrets/secret_key.txt` | Django `SECRET_KEY`, created on first run | No (ignored) |
| `.media/` | Uploaded CSV files | No (ignored) |
| `/tmp/mathesar-dev/` | `django.log`, `vite.log`, PID files | Outside the repo |

### Environment

`agents/bin/dev-env` holds the environment. It mirrors the `dev-service` block of `docker-compose.dev.yml`. The scripts source it. Source it yourself before running `manage.py`, `pytest` or `psql` by hand:

```
source agents/bin/dev-env
.venv/bin/python manage.py shell
```

Variables already set in your shell win, so you can point the scripts at another PostgreSQL server:

```
POSTGRES_HOST=db.internal POSTGRES_USER=me POSTGRES_PASSWORD=secret agents/bin/setup
```

Django reads its settings from environment variables only. It does not read `.env`. The `.env` file is for `docker compose`.

### Differences from the Docker dev stack

- PostgreSQL version is whatever the host has. CI tests 14 to 18.
- No object store. File columns need the `obj-store` service and `file_storage.yml` (see `DEVELOPER_GUIDE.md`, "Working with file attachments").
- The `mathesar` role is a PostgreSQL superuser in both setups. Permission bugs do not show up with it. Test those with a second, limited role (see `agents/docs/02-backend/auth-permissions.md`).
- Usage analytics are off. Nothing is sent, because no installation ID exists and the development settings point the analytics URLs at `example.com`.

## Docker path

Follow `DEVELOPER_GUIDE.md`, "Local development setup". In short:

```
cp .env.example .env
docker compose -f docker-compose.dev.yml up -d dev-service
```

- Containers: `mathesar_service_dev` (Django and Vite) and `mathesar_dev_db` (PostgreSQL with pgTAP).
- Run commands inside them with `docker exec`, for example `docker exec mathesar_service_dev pytest`.
- `agents/bin/check` runs suites on the host and is meant for the native path. With Docker, use the `docker exec` commands in `DEVELOPER_GUIDE.md`.
- Do not source `agents/bin/dev-env` in the shell that runs `docker compose`. Compose would substitute its values (`POSTGRES_HOST=localhost`) into the compose file.
- Behind a proxy that re-signs TLS, the image build fails on certificate checks. `agents/docs/01-setup/production-stack.md` describes how the scripts handle that for their own builds.

## Sandbox notes

- `sudo` or root is needed only to install or start PostgreSQL and to create the first role. Everything else runs unprivileged.
- Ephemeral sandboxes stop PostgreSQL when the container restarts. `agents/bin/start` starts it again.
- Port 3000 must be reachable by the browser that loads port 8000. In development mode Django serves HTML that loads scripts from `http://<same host>:3000`. A browser inside the sandbox (Playwright) needs no extra setup.
- If the first run of the app shows "Complete installation", no superuser exists. Run `agents/bin/setup` again.

Problems: see [troubleshooting.md](./troubleshooting.md).
