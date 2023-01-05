#!/usr/bin/env bash


# For deployments, the DockerFile is configured to build the
# client. Hence, instead of using this script, the web server
# can be directly started.

cd mathesar_ui

# Run vite dev server only in dev mode
npm run dev &

cd ..
python install.py -s
python manage.py runserver 0.0.0.0:8000 && fg
