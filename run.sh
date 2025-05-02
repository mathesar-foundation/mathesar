#!/usr/bin/env bash
set -e

# Start the database
# Check for our required POSTGRES_ env variables. Password and Port are optional
# in order to support connection over the UNIX socket and other configurations.
if [ -z "${POSTGRES_USER}" ] || [ -z "${POSTGRES_HOST}" ] || [ -z "${POSTGRES_DB}" ]
then
  echo "Starting inbuilt database"
  ./db-run.sh
  export POSTGRES_USER=postgres
  export POSTGRES_PASSWORD=mathesar
  export POSTGRES_HOST=localhost
  export POSTGRES_PORT=5432
  export POSTGRES_DB=mathesar_django
fi

python -m mathesar.install
# Start the Django server on port 8000. Add debug log level to gunicorn when appropriate.
gunicorn config.wsgi -b 0.0.0.0:8000 $([ "$DEBUG" = "true" ] && echo -n "--log-level=debug") && fg

