# Integration tests

Integration tests (also known as "end-to-end tests" or "E2E tests" within the Mathesar project) are automated tests that use a web browser to interact with the application, performing high-level operations and assertions to safeguard user workflows against regressions after lower-level code changes.

## Overview

- We use [Playwright](https://playwright.dev) for integration testing.
- We write integration tests in Python (and use pytest to run Playwright) so that the integration tests utilize our existing backend architecture and test fixtures.

## Setup

### 1. Set up your environment

> **♻️ Re-do** these steps if you **move to a new machine**.

1. (For Mac OS only):
    1. Install and open [XQuartz](https://www.xquartz.org/).
    1. In "XQuartz" -> "Preferences" -> "Security", Enable "Allow connections from network clients"

1. In your `.env` file, change `DOCKERFILE=Dockerfile` to `DOCKERFILE=Dockerfile.integ-tests` so that Docker will build your container with extra functionality to run the E2E tests.

### 2. Build Docker container

Running integration tests requires a separate Docker setup using a much beefier Docker container.

> **♻️ Re-do** these steps if you **rebuild your Docker container** (e.g. when pulling new changes from `master` that add a pip package).

1. (For Mac OS only) Modify `docker-compose.yml`, changing `DISPLAY=${DISPLAY}` to `DISPLAY=${YOUR_IP}:0`, e.g. `DISPLAY=192.168.29.198:0`
1. Re-build the container by running `docker-compose up --build`
1. Discard your changes to `docker-compose.yml` so you don't commit them.
1. After this, you can continue to use this newly built Docker container as your default development environment for other work too.


### 3. Build front end

> **♻️ Re-do** these steps if you **make or pull changes to the front end code**.

1. Run this command to build the front end files.

    ```
    docker exec -w /code/mathesar_ui mathesar_service npx vite build
    ```

### 4. Allow X11 socket forwarding for GUI tools

> **♻️ Re-do** these steps if you **restart your machine**.

1. To use Playwright's [GUI debugging tools](https://playwright.dev/python/docs/debug), run the following command on your host machine to permit applications like Chromium running within Docker to connect to the X server on your host machine.

    - For Linux, run `xhost +`

    - For Mac OS, run `xhost +${YOUR_IP}` -- e.g. `xhost +192.168.29.198`


## Running tests

- Run a single test, using the name of its defining function:

    ```
    docker exec mathesar_service pytest --no-cov -k test_page_shows_welcome_text
    ```

- Run all E2E tests:

    ```
    docker exec mathesar_service pytest --no-cov mathesar/tests/integration
    ```

    This might take a while, and you shouldn't need to do it yourself on a regular basis because our GitHub CI workflow does it automatically for every PR.



## Tips for writing tests

### Learn about Playwright Selectors

Even if you're new to Playwright, you'll be able to get pretty far just by following the patterns set in our existing E2E tests. But understanding [Selectors](https://playwright.dev/python/docs/selectors) will be important as you begin to write your own tests.

### Inspect the page during a test

The [Playwright inspector](https://playwright.dev/python/docs/inspector) allows you to stop your test and play with the page in a browser to see what it's doing.

1. Add `page.pause()` to your test at the point where you'd like to inspect.

1. Run your test with `--headed` passed to `pytest`

    ```
    docker exec mathesar_service pytest --headed --no-cov -k test_page_shows_welcome_text
    ```

1. Within the Inspector, you can press "Step Over" to move through your test one statement at a time, or "Resume" to run the test until the next `pause` call.

### Record user actions

1. Within the Playwright Inspector, press "Record".
1. Do stuff to the page. Click. Fill data into inputs. Etc.
1. See python code appear within the Inspector.
1. Copy-paste that code into your test, making adjustments as necessary.

### See suggested selectors for page elements

1. Within the Playwright Inspector, press "Explore".
1. Hover on different elements of the page to see selectors that would target them.

### Validate your custom selectors

1. With the Playwright Inspector open, view the page and open the browser's development tools console.
1. Execute the following Javascript to see which element is selected.

    ```js
    playwright.$("header button.dropdown.trigger:has-text('mathesar_db_test')")
    ```
1. Learn more within the [Playwright docs](https://playwright.dev/python/docs/debug#selectors-in-developer-tools-console).


