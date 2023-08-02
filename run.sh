#!/usr/bin/env bash
set -e

# Start the database
if [[ -z "${DJANGO_DATABASE_URL}" ]]; then
  echo "Starting inbuilt database"
  ./db-run.sh
  export DJANGO_DATABASE_URL='postgres://mathesar:mathesar@localhost:5432/mathesar_django'
  if [[ -z "${MATHESAR_DATABASES}" ]]; then
    export MATHESAR_DATABASES='(mathesar_tables|postgresql://mathesar:mathesar@localhost:5432/mathesar)'
  fi
fi

python install.py --skip-confirm
# Start the Django server on port 8000.
gunicorn config.wsgi -b 0.0.0.0:8000 && fg
