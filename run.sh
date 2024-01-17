#!/usr/bin/env bash
set -e

# Start the database
#
if [ -z "${POSTGRES_USER}" ] || [ -z "${POSTGRES_PASSWORD}" ] \
  || [ -z "${POSTGRES_HOST}" ] || [ -z "${POSTGRES_PORT}" ] \
  || [ -z "${POSTGRES_DB}" ]
then
  echo "Starting inbuilt database"
  ./db-run.sh
  export POSTGRES_USER=postgres
  export POSTGRES_PASSWORD=mathesar
  export POSTGRES_HOST=localhost
  export POSTGRES_PORT=5432
  export POSTGRES_DB=mathesar_django
  if [[ -z "${MATHESAR_DATABASES}" ]]; then
    export MATHESAR_DATABASES='(mathesar_tables|postgresql://postgres:mathesar@localhost:5432/mathesar)'
  fi
fi

python -m mathesar.install --skip-confirm
# Start the Django server on port 8000.
gunicorn config.wsgi -b 0.0.0.0:8000 && fg
