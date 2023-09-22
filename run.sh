#!/usr/bin/env bash
set -e

# Start the database
if [[ -z "${DJANGO_DATABASE_URL}" ]]; then
  echo "Starting inbuilt database"
  ./db-run.sh
  export DJANGO_DATABASE_URL='postgres://postgres:mathesar@localhost:5432/mathesar_django'
  if [[ -z "${MATHESAR_DATABASES}" ]]; then
    export MATHESAR_DATABASES='(mathesar_tables|postgresql://postgres:mathesar@localhost:5432/mathesar)'
  fi
fi

python -m mathesar.install --skip-confirm
# Start the Django server on port 8000.
gunicorn config.wsgi -b 0.0.0.0:8000 && fg
