# Integration tests

Integration tests (also known as "end-to-end tests" or "E2E tests" within the Mathesar project) are automated tests that use a web browser to interact with the application, performing high-level operations and assertions to safeguard user workflows against regressions after lower-level code changes.

## Overview

- We use [Playwright](https://playwright.dev) for integration testing.
- We write integration tests in Python (and use pytest to run Playwright) so that the integration tests utilize our existing backend architecture and test fixtures.

## Setup

Running integration tests requires a separate Docker setup using a much beefier Docker container.

1. Modify `docker-compose.yml`

    1. (All platforms): Change `dockerfile: Dockerfile` to `dockerfile: Dockerfile.integ-tests`
    1. (For Mac OS only): Also change `DISPLAY=${DISPLAY}` to `DISPLAY=${YOUR_IP}:0`, e.g. `DISPLAY=192.168.29.198:0`

1. (For Mac OS only):
    1. Install and open [XQuartz](https://www.xquartz.org/).
    1. In "XQuartz" -> "Preferences" -> "Security", Enable "Allow connections from network clients"

1. Re-build the container by running `docker-compose up --build`
1. Discard your changes to `docker-compose.yml` so you don't commit them.
1. After this, you can continue to use this newly built Docker container as your default development environment for other work too.

## Running tests

1. Start the Docker container, if needed.

    ```
    docker-compose up
    ```

1. Build the front end.

    ```
    docker exec -w /code/mathesar_ui mathesar_service npx vite build
    ```

    **Important:** if you make changes to front end files, you'll need to execute the above command again to _re-build_ the front end before those changes will be reflected when running your test. We would like to set the E2E tests to run off the vite dev server, but we haven't yet figured out how to do that.

1. Run tests.

    ```
    docker exec mathesar_service pytest --no-cov mathesar/tests/integration
    ```

    Passing `mathesar/tests/integration` (as above) will run all the integration tests. If you want to be more selective, you can pass the path to one file instead, or you can pass `-k test_foo` to run a single test by the name of its defining function.

## Writing tests

TODO

### Test generator

TODO

[Test Generator](https://playwright.dev/python/docs/codegen)

## Debugging tests

Playwright has a number of fully-featured [GUI debugging tools](https://playwright.dev/python/docs/debug) to speed up the process of writing tests. You can run these tools through the Docker container by using "X11 socket forwarding" to allow the applications (e.g. Chromium) in the container to connect to the X server on your host machine.

Before using any of these tools, you'll need to run the following command on your host machine to permit other clients to connect to your X server. You'll need to re-run this command again if you come back after restarting your X server.

- For Linux:

    ```
    xhost +
    ```

- For Mac OS:

    Run `xhost +${YOUR_IP}`. e.g. `xhost +192.168.29.198`

### Inspector

The [Playwright inspector](https://playwright.dev/python/docs/inspector) allows you to stop your test and play with the page in a browser to see what it's doing.

1. Add `page.pause()` to your test at the point where you'd like to inspect

1. Run your test with the `--headed` passed to `pytest`

    ```
    docker exec mathesar_service pytest --headed --no-cov mathesar/tests/integration
    ```


