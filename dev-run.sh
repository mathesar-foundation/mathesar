#!/usr/bin/env bash
# Start the database
if [[ -z "${DJANGO_DATABASE_URL}" ]]; then
  echo "Starting inbuilt database"
  ./db-run.sh
  export DJANGO_DATABASE_URL='postgres://postgres:mathesar@localhost:5432/mathesar_django'
  if [[ -z "${MATHESAR_DATABASES}" ]]; then
    export MATHESAR_DATABASES='(mathesar_tables|postgresql://postgres:mathesar@localhost:5432/mathesar)'
  fi
fi

# For deployments, the DockerFile is configured to build the
# client. Hence, instead of using this script, the web server
# can be directly started.

cd mathesar_ui

# Run vite dev server only in dev mode
npm run dev &

cd ..
python -m mathesar.install --skip-confirm
python manage.py createsuperuser --no-input --username admin --email admin@example.com
python manage.py runserver 0.0.0.0:8000 && fg
