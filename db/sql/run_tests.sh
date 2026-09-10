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
    pg_prove -U mathesar -d mathesar_testing -v "$sql"/run_jit_tests.sql
    EXIT_CODE=$?
fi

if [[ $EXIT_CODE -eq 0 ]]; then
    psql -q -U mathesar -d postgres -v "ON_ERROR_STOP=1" \
        -c "CREATE DATABASE mathesar_remove_testing;"
    psql -q -U mathesar -d mathesar_remove_testing -v "ON_ERROR_STOP=1" \
        -c "CREATE EXTENSION IF NOT EXISTS pgtap;"
    pg_prove -U mathesar -d mathesar_remove_testing -v "$sql"/test_msar_remove.sql
    REMOVE_EXIT_CODE=$?
    psql -q -U mathesar -d postgres -v "ON_ERROR_STOP=1" \
        -c "DROP DATABASE IF EXISTS mathesar_remove_testing WITH (FORCE);"
    EXIT_CODE=$(( EXIT_CODE > REMOVE_EXIT_CODE ? EXIT_CODE : REMOVE_EXIT_CODE ))
fi
psql -q -U mathesar -d postgres -v "ON_ERROR_STOP=1" -f "$sql"/test_shutdown.sql
EXIT_CODE=$(( EXIT_CODE > $? ? EXIT_CODE : $? ))  # Collect max exit code
exit $EXIT_CODE
