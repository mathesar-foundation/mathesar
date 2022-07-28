#!/usr/bin/env bash

# this script performs the initial setup

URL="http://0.0.0.0:8000/"
status_code=000
ENV_EXAMPLE=".env.example"
ENV_ORIG=".env"
TIMEOUT_TIME=60

error_check() {
    if [ $? -ne 0 ]; then
        echo "FAILED"
        exit
    fi
}

# instantiate .env file
cp ${ENV_EXAMPLE} ${ENV_ORIG}

# runs docker compose as daemon process
docker-compose up -d
error_check

# loop until http://0.0.0.0:8000/ is not active and
# timeout does not occurs
while [[ ${status_code} -ne 302 && ${SECONDS} -lt ${TIMEOUT_TIME} ]];
do
    status_code=$(curl --write-out %{http_code} --silent --output /dev/null ${URL})
done

# if timeout occurs
if [[ ${SECONDS} -ge ${TIMEOUT_TIME} ]]; then
    echo "TIMEOUT OCCURRED"
    exit
fi

# run migrations
docker exec mathesar_service python manage.py migrate
error_check

# run install.py
docker exec -it mathesar_service python install.py
error_check

