#!/usr/bin/env bash

# This script checks if Mathesar is running in dev mode
# or prod. If dev mode, it starts the vite dev server,
# else it runs a client build.

# This script is only supposed to be used either directly
# or with docker-compose. It rebuilds the client everytime
# Mathesar starts.

# For deployments, the DockerFile is configured to build the
# client. Hence, instead of using this script, the web server
# can be directly started.

cd mathesar_ui && npm install --unsafe-perm

# Run vite dev server only in dev mode
if [[ "$MODE" == "DEVELOPMENT" || "$1" == "dev" ]]; then
  npm run dev &
else
  npm run build
fi

cd ..
python python install.py && manage.py migrate
python manage.py createsuperuser --no-input --username admin --email admin@example.com
python manage.py runserver 0.0.0.0:8000 && fg
