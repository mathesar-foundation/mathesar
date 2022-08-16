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

# if container is ready for migrations
mathesar_service_running=$(docker container inspect -f '{{.State.Running}}' ${CONTAINER_NAME})
while [[ ${mathesar_service_running} != "true" ]];
do
    mathesar_service_running=$(docker container inspect -f '{{.State.Running}}' ${CONTAINER_NAME})
done

# run migrations and install.py
execute docker exec mathesar_service sh -c "\"python manage.py migrate && python install.py\""

