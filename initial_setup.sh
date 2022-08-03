#!/usr/bin/env bash

URL="http://0.0.0.0:8000/"
status_code=000
ENV_EXAMPLE=".env.example"
ENV_ORIG=".env"
#TIMEOUT_TIME=60

# instantiate .env file
cp ${ENV_EXAMPLE} ${ENV_ORIG}

# runs docker compose as daemon process
docker-compose up -d || echo "FAILED AT: docker-compose up -d"

#while [[ ${status_code} -ne 302 && ${SECONDS} -lt ${TIMEOUT_TIME} ]];
while [[ ${status_code} -ne 302 ]];
do
    status_code=$(curl --write-out %{http_code} --silent --output /dev/null ${URL})
done

echo "
DOCKER CONTAINER RUNNING IN THE BACKGROUND...
Application is now available at http://localhost:8000/
"

# run migrations and install.py
docker exec mathesar_service sh -c "python manage.py migrate && python install.py"\
    || echo "FAILED AT: docker exec mathesar_service sh -c 'python manage.py migrate && python install.py'"

