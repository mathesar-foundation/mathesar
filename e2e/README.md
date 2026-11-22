# End-to-end tests

Playwright tests that drive a production Mathesar instance through the browser. They cover what a user can do in the UI and check the result in PostgreSQL. They are the validation gate for changes to the front end, such as a framework migration.

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
- Start one run against a stack at a time. Tests that delete roles or server records (`runsAlone`) and the teardown that drops the roles of a run are coordinated inside one run only. A second run at the same time can fail with an error about a role or a server that no longer exists (see `current-role-lookup-fails-on-dropped-role` and `page-load-fails-while-server-deleted` in `KNOWN_BUGS.md`).
- File attachments are stored in the `object-store` service (RustFS), configured by `FILE_STORAGE_DICT` in `docker-compose.yml`. Uploads through public forms are limited to 1 MiB.

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
| `tests/setup/` | Runs first: installs a fresh instance through the UI and signs in. Runs last: drops the roles of the run |
| `support/fixtures.ts` | `test` and `expect`. Every spec imports them from here |
| `support/api/` | Seeding and inspection behind the UI: JSON-RPC and SQL |
| `support/ui/components/` | Objects for controls that many pages share: modal, sheet, select, menu |
| `support/ui/pages/` | One object per page or large panel |

## Rules for tests

1. A test exists to find a breakage: it fails when the behaviour in its name breaks. Before you commit a test, break that behaviour, for example with a wrong or late answer through `page.route`, and watch the test fail on the assertion of that behaviour, not on an earlier step. A test that fails only when you change its expected value checks the locator, not the behaviour. These pass with the behaviour broken, even after their author checked them:
   - An assertion that already held before the action.
   - A negative assertion on a locator that never matched anything.
   - A title that claims more than the assertions check.
   - A check of the stored data that only counts rows.
   - A check that a request was not sent, made before a late one could arrive. Check after the page has settled.
   - A modal, dropdown or popover that closes is still on the page while it fades, so `toBeVisible` and `fill` pass on it. Check that it stays open with `expectStaysOpen(locator)` or `modal.expectOpen()`.
1. A test owns its data. Use the `database` or `schema` fixture, which give each test a new database. No test depends on another test or on the order of execution.
1. A deletion that pages of the test could notice waits until they close: register it in `pendingCleanups`. Deferred deletions run while other tests run, so a `runsAlone` test deletes a server record itself, as `otherHostSpelling` does, and roles stay until the end of the run (rule below).
1. Seed user data with SQL (`runSqlInSchema`). Seed what only Mathesar knows (users, collaborators, explorations, forms, metadata) through the API (`api`). Do the action under test through the UI.
1. Assert what the user sees, and then the stored result: the rows or the catalog in PostgreSQL, or the API for Mathesar's own objects. A UI that looks right over wrong data is a failure.
1. Selectors live in `support/ui/`, never in a spec. Prefer role, label and visible text. Then the app's own `data-*` attributes. A CSS class is the last resort. When the app offers no reliable hook, add an attribute to the app that also serves users or developers, such as an ARIA role or label. Do not add test ids.
1. Never wait for a fixed time. Assertions retry on their own. For a value that is not on the page, use `expect.poll` or `expect(...).toPass()`.
1. Let each step finish before the next one: the end of loading, "All Changes Saved" after an edit, the effect of each key in a keyboard test. A late answer of an earlier step, or keys pressed faster than the page renders, change what the next step finds.
1. One behaviour per test. Name the test after the behaviour: `renames a schema and changes its description`.
1. Names that tests create at the level of the server come from `uniqueName`, because tests run in parallel against one instance. Roles come from `uniqueRoleName` and stay until the end of the run, since a dropped role breaks the pages of other tests. A test that deletes a role or a server record on purpose is `runsAlone`.
1. An error in the browser fails the test that caused it: an exception that nothing catches, or a message that the app logs with `console.error`. A test that pins such an error as a known bug, or that makes the server fail on purpose, allows it with `test.use({ allowedBrowserErrors: /message/ })` in a `test.describe` that holds only the tests that can hit it: an allowance for a whole file or folder hides new errors.

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

A pin holds in every run. When the bug depends on timing, force the order, for example by holding an RPC call with `holdRpcCalls`, or pin only the part that always happens. When neither works, keep only the `test.fixme`, or no test for a race that no test can bring about.

`npx playwright test --list --grep @known-bug` prints the pinned tests.

## Visual tests

The tests in `tests/visual/` compare screenshots of key screens with the baselines next to them: the login form, the home, database, schema and record pages, the table sheet with every data type and in its main states, the inspector, the dropdowns and modals of the table page, the record selector, the Data Explorer, forms, the import preview, the administration pages and the profile. They catch changes in how the app looks that leave its behaviour intact.

Fonts and rendering differ between machines, so the baselines hold only in the runner image. `Dockerfile` sets `E2E_VISUAL_TESTS` in it, which adds the Playwright project `visual`. Other runs, such as those on the host, leave the project out. `--project=chromium` runs the other tests alone.

After an intended change of the UI, write new baselines and commit them:

```
.agents/bin/e2e run --project=visual --update-snapshots
```

A failed comparison leaves the expected image, the actual one and their difference in `test-results/`. The HTML report shows them side by side.

A screenshot must be the same in every run, also while other tests change the instance. The tests seed fixed content under fixed names, wait until the page has settled, and mask or pin what changes by nature, such as the running version and the time. The comparison is stricter than Playwright's default, so that a faint color such as the background of selected cells counts.

## Other browsers

Pull requests run the tests in Chromium. For a major change, such as an upgrade of the front end framework, run them in Firefox and WebKit too. `E2E_ALL_BROWSERS` adds the projects `firefox` and `webkit`:

```
E2E_ALL_BROWSERS=1 docker compose -f docker-compose.yml -f e2e/docker-compose.yml run --rm e2e --project=firefox --project=webkit
```

A test checks the same behaviour in all three browsers. Where they differ:

- Firefox drops Playwright's `fill` on an input that formats what the user types, such as a number, a date or a filter value. Type into it with `fillFormattedInput`, or `Sheet.editFormattedCell` for a cell.
- Firefox and WebKit report the loads that a navigation cuts short. Before a test leaves a page, it waits until the page has loaded.
- Where the app shows a text of the browser, such as the message of a failed `fetch` or of a `TypeError`, keep one value per browser. Read the message of an uncaught error with `uncaughtErrorMessage`: WebKit puts the name of the error in front of it.
- A behaviour that only some browsers have is skipped in the others with `test.skip(browserName !== 'chromium', '<why>')` at the top of the test. No `if` on the browser in the body of a test.
- A route that reads the server's answer with `route.fetch` asks for gzip, as `failOnlyRpcMethod` does. Firefox offers zstd, which Playwright cannot decode.
- Firefox does not send a request that the page cancels right after it starts. Count the RPC calls of a page with `recordRpcFetches`, which sees them all.
- A bug of the app in one browser is pinned in that browser only. Its test of the correct behaviour is marked `test.fail(browserName === 'firefox', 'Known bug <id>')`, unless it is a `test.fixme` already. The heading of its entry names the browser: `### <id> (Firefox)`. A known bug that does not happen in every browser has a **Browsers** line in its entry, and its pin is skipped where it does not happen.

## Checks

```
npm run typecheck
npm run lint
npm run check-format
```
