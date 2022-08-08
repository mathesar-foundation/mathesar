#!/usr/bin/env bash

URL="http://0.0.0.0:8000/"
status_code=000
ENV_EXAMPLE=".env.example"
ENV_ORIG=".env"
#TIMEOUT_TIME=60

function execute {
    # Echo what the command is before running it
    echo "$@"
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

#while [[ ${status_code} -ne 302 && ${SECONDS} -lt ${TIMEOUT_TIME} ]];
while [[ ${status_code} -eq 000 ]];
do
    status_code=$(curl --write-out %{http_code} --silent --output /dev/null ${URL})
done

echo "
DOCKER CONTAINER RUNNING IN THE BACKGROUND...
Application is now available at http://localhost:8000/
"

# run migrations and install.py
execute docker exec mathesar_service sh -c "python manage.py migrate && python install.py"

