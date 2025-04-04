#!/usr/bin/env bash
set -e

# Check and start the database
./db-check-run.sh

python -m mathesar.install
# Start the Django server on port 8000. Add debug log level to gunicorn when appropriate.
gunicorn config.wsgi -b 0.0.0.0:8000 $([ "$DEBUG" = "true" ] && echo -n "--log-level=debug") && fg
