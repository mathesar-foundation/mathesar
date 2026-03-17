#!/usr/bin/env sh

EXIT_CODE=0
docker compose -f docker-compose.e2e.yml run --rm e2e-test-runner npx playwright test "$@"
EXIT_CODE=$(( EXIT_CODE > $? ? EXIT_CODE : $? ))
docker compose -f docker-compose.e2e.yml down -v -t 1
exit $EXIT_CODE
