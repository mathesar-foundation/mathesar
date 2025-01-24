#!/usr/bin/env bash
set -e

# Move to script directory
cd "$(dirname "$0")"
SCRIPT_DIR="$(pwd)"

if [ -z "${POSTGRES_USER}" ] || [ -z "${POSTGRES_PASSWORD}" ] \
  || [ -z "${POSTGRES_HOST}" ] || [ -z "${POSTGRES_PORT}" ] \
  || [ -z "${POSTGRES_DB}" ]
then
  echo "Error: Django database env variables not set"
  exit 1
fi

export DJANGO_SETTINGS_MODULE=config.settings.production
export ALLOWED_HOSTS='*'
export UV_PYTHON_INSTALL_DIR=$SCRIPT_DIR/__python__/

mkdir -p $UV_PYTHON_INSTALL_DIR

$SCRIPT_DIR/uv venv
$SCRIPT_DIR/uv run -m mathesar.install --skip-confirm
# Start the Django server on port 8000.
$SCRIPT_DIR/uv run gunicorn config.wsgi -b 0.0.0.0:8000 && fg
