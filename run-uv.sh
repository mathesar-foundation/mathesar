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

# Start the server on port 8000.
$SCRIPT_DIR/.mathesar-venv/bin/gunicorn config.wsgi -b 0.0.0.0:8000 $([ "$DEBUG" = "true" ] && echo -n "--log-level=debug")
