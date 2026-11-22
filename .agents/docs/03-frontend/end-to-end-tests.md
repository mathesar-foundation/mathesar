# End-to-end tests

The Playwright suite in `e2e/` drives the UI of a running Mathesar in a browser and checks the result in PostgreSQL. Read this before you change what the UI does, before a change to the front end framework or its build, and when a test of the suite fails. `e2e/README.md` has the layout of the suite and the rules for writing tests. This file adds what an agent in a sandbox needs.

## When to run it, when to change it

- A change under `mathesar_ui/` or `e2e/`: run the suite. `.agents/bin/check` picks it for such changes. Working for a maintainer, you may leave the full run to the PR's CI (step 4 of "How to work on a task" in `AGENTS.md`).
- A change to an RPC method, an SQL function or a Django view that a page uses: run the folders of that feature (`.agents/bin/e2e run tests/<area>`).
- A change to what a user can see or do: add or update the tests in the same PR.
- The suite asserts the behaviour the app has today, also where that behaviour is wrong (`e2e/KNOWN_BUGS.md`). A test that fails after your change means that behaviour changed. Find out whether the task asked for that change before you touch the test.
- A rewrite that must not change behaviour, such as a framework upgrade, passes when the suite passes unchanged. Run it in Firefox and WebKit as well: `E2E_ALL_BROWSERS=1 .agents/bin/e2e run --project=firefox --project=webkit`.

## Commands

| Command | Does |
|---|---|
| `.agents/bin/e2e up` | Builds the production images and the test runner from the working tree and starts the stack of `docker-compose.yml` with `e2e/docker-compose.yml`. Run it again after a change to the app |
| `.agents/bin/e2e run [args]` | Runs the tests in the runner container against that stack. Arguments go to `playwright test`: `run tests/table`, `run --grep "renames a schema"`, `run tests/table/editing.spec.ts:36` |
| `.agents/bin/e2e dev [args]` | Runs the tests against the native dev servers (`.agents/bin/start`). No image build |
| `.agents/bin/e2e down` | Stops the stack and deletes its data |
| `.agents/bin/check e2e` | A full run on a fresh instance: `down`, `up`, `run`, `down` |
| `.agents/bin/check e2e-lint` | Format check, ESLint and `tsc` for the code in `e2e/` |

- The stack uses the container names of `docker-compose.yml`, as `.agents/bin/prod` does. Stop one before you start the other.
- Tests in `e2e/` are mounted into the runner. A change to a test needs no rebuild. A change to the app needs `.agents/bin/e2e up`, which takes as long as `.agents/bin/prod up`.
- For a loop on front end code, use `.agents/bin/e2e dev`: Vite serves your edits at once. A test takes longer there than on the production build. Before hand off, run on the production stack, or leave that to the PR's CI as the first section allows.
- On an instance that has a user, the installation tests in `e2e/tests/setup/` are skipped. They run on a fresh stack: `.agents/bin/check e2e`, or `.agents/bin/e2e down` before `up`.
- One file per instance in `e2e/.auth/` holds the admin session. It is written by the setup project, which every run starts with.

## Reading a failure

- The list reporter prints the failed assertion with the locator and what it found.
- `e2e/test-results/<test>/error-context.md` has the ARIA snapshot of the page at the moment of failure. `test-failed-1.png` next to it is the screenshot. Read both before you change a selector.
- `the app threw or logged errors`: the test itself passed, but the app threw an exception that nothing caught, or logged an error with `console.error`. The message lists them. This is a defect of the app unless the test allows it in `allowedBrowserErrors`, because it pins a known bug or makes the server fail on purpose.
- A timeout on many tests at once usually means an overloaded sandbox. Run with `--workers=1`.
- A test that fails twice in a row for the same reason is not flaky: find the cause. Before you call it a bug of the app, rule out the suite: another run on the same stack at the same time, a test that deletes what others load, a page left while it loads.

## Breaking the app to prove a test

Rule 1 of "Rules for tests" in `e2e/README.md` asks you to watch each new test fail. Break the behaviour the way a rewrite could:

- An RPC answer that is wrong or late: `page.route`, or the helpers in `e2e/support/rpc-failures.ts` and `e2e/support/held-requests.ts`.
- A component: edit it in `mathesar_ui/` and run the test with `.agents/bin/e2e dev`, where Vite serves the edit without an image build. Revert the edit afterwards.

## What costs time to find

- A browser context or request context that a test creates inherits the admin session of the project. `signInAs` and the API client start signed out on purpose. Do the same for anonymous pages: `browser.newContext({ storageState: { cookies: [], origins: [] } })`.
- The table page replaces a selection that was made while it still loads. `TablePage.goto` in `e2e/support/ui/pages/table-page.ts` waits for the end of loading.
- The sheet keeps only the rows near the viewport in the DOM. Seed small tables, or scroll.
- Tests run in parallel against one instance. Each test gets its own database. Users and PostgreSQL roles are shared by the whole server: name them with `uniqueName` and `uniqueRoleName`. The teardown project drops the roles of fixtures at the end of the run (`--no-deps` skips it). A test that deletes what other tests load, such as a role or a server record, takes `runsAlone` from `support/fixtures.ts`.
- Run one Playwright run against the stack at a time. `runsAlone` and the teardown that drops the roles of a run work only inside that run, so two runs at once (two terminals, or agents working in parallel) can fail each other's tests with an error about a role or a server that no longer exists. Such a failure does not come from your change: rerun the test alone. `KNOWN_BUGS.md` has the cause (`current-role-lookup-fails-on-dropped-role`, `page-load-fails-while-server-deleted`).
- A test that passes on a long-lived stack can still depend on what other tests left behind. Only a fresh instance shows it: the CI of the PR, or `.agents/bin/check e2e`.
- A Playwright project that other projects depend on runs in full in every shard. For tests that must run alone, use `runsAlone`, not a project of their own.
- The app asks GitHub for the latest release. The fixtures answer that request (`e2e/support/github-releases.ts`).
- Tests that pass in Chromium can fail in Firefox and WebKit for reasons of the test: Firefox drops Playwright's `fill` on the number, date and other formatted inputs of the app, and both report the loads of a page that a test leaves early. `e2e/README.md` ("Other browsers") has the rules.
- New users must change their password at the first login in the UI. `createUser` clears that unless `mustChangePassword` is set.
