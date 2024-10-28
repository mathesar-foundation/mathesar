#!/usr/bin/env bash

# For deployments, the DockerFile is configured to build the
# client. Hence, instead of using this script, the web server
# can be directly started.
if [ -z "$NODE_MAJOR" ]; then
    cd mathesar_ui

    # Run vite dev server only in dev mode
    npm run dev &

    cd ..
fi

python -m mathesar.install --skip-confirm
python manage.py createsuperuser --no-input --username admin --email admin@example.com
python manage.py runserver 0.0.0.0:8000 && fg
