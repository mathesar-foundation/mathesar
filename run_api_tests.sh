#!/usr/bin/env sh

docker compose -f docker-compose.test.yml up \
    --abort-on-container-exit \
    --timeout 0 \
    --force-recreate \
    -V \
    --exit-code-from test-runner \
    test-runner test-user-db test-db api-test-service
