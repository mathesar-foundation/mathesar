# Integration tests

Integration tests (also known as "end-to-end tests" or "E2E tests" within the Mathesar project) are automated tests that use a web browser to interact with the application, performing high-level operations and assertions to safeguard user workflows against regressions after lower-level code changes.

## Overview

- We use [Playwright](https://playwright.dev) for integration testing.
- We write integration tests in Python (and use pytest to run Playwright) so that the integration tests utilize our existing backend architecture and test fixtures.

## Setup

Running integration tests requires a separate Docker setup using a much beefier Docker container.

1. Modify `docker-compose.yml`

    Change `dockerfile: Dockerfile` to `dockerfile: Dockerfile.integ-tests`

1. Re-build the container by running `docker-compose up --build`
1. Discard your changes to `docker-compose.yml` so you don't commit them.
1. After this, you can continue to use this newly built Docker container as your default development environment for other work too.

## Running tests

The integration tests require the server to be up and running. You can run the tests by executing the following command:

```
docker exec mathesar_service pytest --no-cov mathesar/tests/integration
```

## Writing tests

TODO

### Test generator

TODO

[Test Generator](https://playwright.dev/python/docs/codegen)

## Debugging tests

Playwright has a number of fully-featured [GUI debugging tools](https://playwright.dev/python/docs/debug) to speed up the process of writing tests. You can run these tools through the Docker container by using "X11 socket forwarding" to allow the applications (e.g. Chromium) in the container to connect to the X server on your host machine.

Before using any of these tools, you'll need to run the following command on your host machine to permit other clients to connect to your X server. You'll need to re-run this command again if you come back after restarting your X server.

```
xhost +
```

### Inspector

The [Playwright inspector](https://playwright.dev/python/docs/inspector) allows you to stop your test and play with the page in a browser to see what it's doing.

1. Add `page.pause()` to your test at the point where you'd like to inspect

1. Run your test with the `--headed` passed to `pytest`

    ```
    docker exec mathesar_service pytest --headed --no-cov mathesar/tests/integration
    ```


