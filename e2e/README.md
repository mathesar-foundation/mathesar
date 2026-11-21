# End-to-end tests

Playwright tests that drive a production Mathesar instance through the browser. They cover what a user can do in the UI and check the result in PostgreSQL.

The suite has its own environment. Nothing here is imported by the app, and the tests import nothing from `mathesar_ui/`.

## Run the suite

From the repo root. This builds the production images from the working tree, starts the stack of `docker-compose.yml`, and runs the tests in a container:

```
docker compose -f docker-compose.yml -f e2e/docker-compose.yml run --rm --build e2e
docker compose -f docker-compose.yml -f e2e/docker-compose.yml down --volumes
```

Arguments after `e2e` go to `playwright test`:

```
docker compose -f docker-compose.yml -f e2e/docker-compose.yml run --rm e2e tests/schemas
docker compose -f docker-compose.yml -f e2e/docker-compose.yml run --rm e2e --grep "renames a schema"
```

- The HTML report is written to `e2e/playwright-report/`, traces and screenshots of failures to `e2e/test-results/`.
- `down --volumes` deletes the data of the stack. Without it, the next run reuses the instance and skips the installation tests.
- The stack uses the container names of `docker-compose.yml`, so it cannot run next to another Mathesar stack on the same machine.

## Develop tests on the host

Start the stack once, then run Playwright from this folder:

```
docker compose -f docker-compose.yml -f e2e/docker-compose.yml up --detach --build --wait
cd e2e
npm ci
npx playwright install chromium
npx playwright test --ui
```

The suite reads these variables. The defaults match the stack above.

| Variable | Default | Meaning |
| --- | --- | --- |
| `MATHESAR_URL` | `http://localhost` | Where the browser finds Mathesar |
| `MATHESAR_USER`, `MATHESAR_PASSWORD` | `admin`, `mathesar-e2e-admin` | The admin user. The setup creates it on a fresh instance |
| `E2E_POSTGRES_HOST`, `E2E_POSTGRES_PORT` | `localhost`, `5433` | The PostgreSQL server of the instance, as the tests reach it |
| `E2E_POSTGRES_USER`, `E2E_POSTGRES_PASSWORD` | `mathesar`, `mathesar` | A superuser on that server |
| `E2E_POSTGRES_HOST_FROM_MATHESAR`, `E2E_POSTGRES_PORT_FROM_MATHESAR` | `mathesar_db`, `5432` | The same server, as Mathesar reaches it |

Any instance works if these point to it, including the dev servers.

## Layout

| Path | Content |
| --- | --- |
| `tests/<area>/` | Specs, one folder per product area |
| `tests/setup/` | Runs first: installs a fresh instance through the UI and signs in |
| `support/fixtures.ts` | `test` and `expect`. Every spec imports them from here |
| `support/api/` | Seeding and inspection behind the UI: JSON-RPC and SQL |
| `support/ui/components/` | Objects for controls that many pages share: modal, sheet, select, menu |
| `support/ui/pages/` | One object per page or large panel |

## Rules for tests

1. A test owns its data. Use the `database` or `schema` fixture, which give each test a new database. No test depends on another test or on the order of execution.
1. Seed user data with SQL (`runSqlInSchema`). Seed what only Mathesar knows (users, collaborators, explorations, forms, metadata) through the API (`api`). Do the action under test through the UI.
1. Assert what the user sees, and then the stored result: the rows or the catalog in PostgreSQL, or the API for Mathesar's own objects. A UI that looks right over wrong data is a failure.
1. Selectors live in `support/ui/`, never in a spec. Prefer role, label and visible text. Then the app's own `data-*` attributes. A CSS class is the last resort. When the app offers no reliable hook, add an attribute to the app that also serves users or developers, such as an ARIA role or label. Do not add test ids.
1. Never wait for a fixed time. Assertions retry on their own. For a value that is not on the page, use `expect.poll` or `expect(...).toPass()`.
1. One behaviour per test. Name the test after the behaviour: `renames a schema and changes its description`.
1. Names that tests create at the level of the server (users, roles, databases) come from `uniqueName`, because tests run in parallel against one instance.
1. An uncaught error in the browser fails the test that caused it.

## Known bugs

The suite asserts the behaviour the app has today, including behaviour that is wrong. This keeps a rewrite of the front end from changing behaviour unnoticed. A bug gets two tests next to each other:

```ts
test('keeps the old value when ...', pinsKnownBug('short-bug-id'), async () => {
  // asserts what happens today
});

test.fixme('saves the new value when ...', async () => {
  // asserts the correct behaviour
});
```

`KNOWN_BUGS.md` lists each bug under its id with the current and the correct behaviour. To fix a bug: fix the app, delete the pinned test, remove `fixme` from the other one, and delete the entry.

`npx playwright test --list --grep @known-bug` prints the pinned tests.

## Checks

```
npm run typecheck
npm run lint
npm run check-format
```
