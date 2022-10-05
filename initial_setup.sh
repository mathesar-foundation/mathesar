#!/usr/bin/env bash

URL="http://0.0.0.0:8000/"
status_code=000
ENV_EXAMPLE=".env.example"
ENV_ORIG=".env"
CONTAINER_NAME="mathesar_service"

function execute {
    # Echo what the command is before running it
    echo "Running: $@"
    # Run the passed command
    eval $@
    local eval_status=$?
    # Enable panicing this function's parent in case of non-zero exit
    set -e
    # Do non-zero exit, if eval's return was non-zero
    [ $eval_status -eq 0 ] || (echo "failed" && exit 1)
    # Disable panicing this function's parent in case of non-zero exit
    set +e
}

# instantiate .env file
cp ${ENV_EXAMPLE} ${ENV_ORIG}

# runs docker compose as daemon process
execute docker-compose up -d
echo "DOCKER CONTAINER RUNNING IN THE BACKGROUND..."

function are_pip_deps_installed {
  docker exec mathesar_service \
    pip3 -vvv freeze -r requirements.txt 2>&1 >/dev/null \
    | grep -q 'not installed' \
    && return 1 \
    || return 0
}

function is_postgres_ready {
  local postgres_container_id=$(docker ps -q --filter ancestor=postgres:13)
  docker exec $postgres_container_id pg_isready > /dev/null
}

function is_ready {
  are_pip_deps_installed && is_postgres_ready
}

# block until container is ready for migrations
until is_ready; do
  execute sleep 0.5s
done

# run migrations and install.py
execute docker exec mathesar_service sh -c "\"python manage.py migrate && python install.py\""

# create superuser
execute docker exec mathesar_service sh -c "\"python manage.py createsuperuser --no-input --username admin --email admin@example.com\""
