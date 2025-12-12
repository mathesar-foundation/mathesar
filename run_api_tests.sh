#!/usr/bin/env sh

EXIT_CODE=0
docker compose -f docker-compose.test.yml run --rm test-runner pytest -svv test_happy_db_setups.py
# Needed once (if) we have multiple scenarios to test. This accumulates the max exit code.
EXIT_CODE=$(( EXIT_CODE > $? ? EXIT_CODE : $? ))
docker compose -f docker-compose.test.yml down -v -t 1
exit $EXIT_CODE
