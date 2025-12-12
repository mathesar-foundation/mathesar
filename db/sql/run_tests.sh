#!/bin/bash

for i in {1..50}; do
    pg_isready -U mathesar -d postgres && break || sleep 0.5
done

if [[ $BASH_SOURCE = */* ]]; then
    sql=${BASH_SOURCE%/*}/
else
    sql=./
fi
sleep 1  # It seems the socket might take a bit longer to appear
psql -q -U mathesar -d postgres -v "ON_ERROR_STOP=1" -f "$sql"/test_startup.sql
EXIT_CODE=$?

if [[ $EXIT_CODE -eq 0 ]]; then
    for i in {1..50}; do
        pg_isready -U mathesar -d mathesar_testing && break || sleep 0.5
    done
    pg_prove --runtests -U mathesar -d mathesar_testing -v "$@"
    EXIT_CODE=$?
fi
psql -q -U mathesar -d postgres -v "ON_ERROR_STOP=1" -f "$sql"/test_shutdown.sql
EXIT_CODE=$(( EXIT_CODE > $? ? EXIT_CODE : $? ))  # Collect max exit code
exit $EXIT_CODE
