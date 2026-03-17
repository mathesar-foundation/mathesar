# Mathesar E2E Testing Framework

## Quick Reference

```
e2e_tests/
  framework/          # Generic, self-contained, extractable test framework
    src/              # Framework source code
      engine/         # Orchestration: defineTest, test runner, dependency resolver, DAG, global setup
      store/          # Data management: registry, outcome store, outcome codes, test context
      config.ts       # Config types, validation, createPlaywrightConfig(), getBaseURL()
      types.ts        # Type definitions
      index.ts        # Public API re-exports
    scripts/          # CLI tools
      screenwriter.ts # Main wrapper — orchestrates generate → validate → run
      generate-runners.ts
      scaffold-test.ts
      validate-dag.ts
      list-outcomes.ts
      visualize-dag.ts
      load-config.ts
  mathesar/           # Mathesar-specific test code
    tests/            # Test definitions — ONE file per test (you write these)
    pages/            # Page Object Models
    db/               # Postgres client + SQL helpers for fixtures
  .generated/         # Auto-generated Playwright runners (gitignored)
```

**To add a test:** create `mathesar/tests/<code>.ts` with `defineTest()`. That's it — the wrapper auto-generates runners and validates the DAG on every `npm run test`.

**Convention:** file name = test code. `install.ts` must contain `defineTest({ code: 'install', ... })`.

## Running Tests

```bash
npm run test              # run all tests (headless)
npm run test:headed       # run with browser visible
npm run test:debug        # run in debug mode
```

The `npm run test` command invokes the screenwriter wrapper (`framework/scripts/screenwriter.ts`), which orchestrates:
1. Load configuration from `screenwriter.config.ts`
2. Generate Playwright runner files in `.generated/`
3. Load test definitions and validate the dependency DAG
4. Spawn Playwright to execute tests

## Framework Concepts

### defineTest

Every test has two halves:
- **fixture** — programmatic setup (DB queries, HTTP calls). Runs when a downstream test needs this test's outcome. Fast.
- **flow** — browser interactions via Playwright Page. Contains assertions. This is the actual user-facing test.

Two overloads based on `params`:

```typescript
// No params → returns RequirementHandle (use directly in requires arrays)
export const install = defineTest<InstallOutcome>({
  code: 'install',
  fixture: async (context) => { /* return outcome data */ },
  flow: async (page, context) => { /* browser test */ },
});

// With params → returns TestCallable (call with args to get RequirementHandle)
export const login = defineTest<LoginOutcome>({
  code: 'login',
  params: { user: 'admin' },           // defaults for standalone run
  primaryParams: ['user'],              // REQUIRED when used as dependency
  requires: () => [install],            // dependencies
  fixture: async (context, params) => { /* return outcome data */ },
  flow: async (page, context, params) => { /* browser test */ },
});
```

### Params

- **primaryParams** — the test's own concern. REQUIRED when calling as dependency: `login('admin')`.
- **Other params** — forwarded from parent. OPTIONAL, fall back to defaults.
- Single primary: `login('admin')` or `login('admin', { optionalParam: 'val' })`.
- Multiple primaries: `createColumn({ table: 'orders', column: 'name' })`.
- Each test explicitly declares and forwards params it wants to expose. No implicit forwarding.

### requires / Dependencies

```typescript
requires: () => [install]                           // read access (default)
requires: () => [createTable('orders').write()]      // write access
requires: (p) => [login(p.user)]                     // param forwarding
```

- `read` — safe to parallelize with other readers.
- `write` — serialized with all other consumers. Two unrelated writers = DAG validation error.
- Dependencies are resolved recursively: if A requires B requires C, running A's flow first runs C's fixture, then B's fixture, then A's flow.

### Outcome Codes

Format: `code(val1,val2,...)` with values sorted by key, JSON-stringified. Non-parameterized: just `code`.

Same outcome code = same DAG node = fixture runs once, result shared. **Changing a default value changes outcome codes — treat as breaking.**

### Outcome Store

- In-memory map + file-backed JSON (`.outcome-data/`) for cross-worker sync.
- `context.get(handle)` returns typed outcome data from a dependency.
- Cleared by `globalSetup` before each run.

### Authentication

```typescript
import { install } from './install';
import { setupAuth } from './login';

// In a downstream flow:
flow: async (page, context) => {
  const loginData = context.get(login('admin'));
  await setupAuth(page, loginData);   // sets session cookies
  await page.goto('/some-page');
  // ... now authenticated
}
```

`login` fixture handles the full Django CSRF dance via HTTP, returns `{ sessionId, csrfToken, username, password }`.

## How to Write a New Test

### 1. Scaffold

```bash
cd e2e_tests
npm run scaffold -- \
  --code connect-database \
  --primary database \
  --params database=default,user=admin \
  --requires login
```

Creates `mathesar/tests/connect-database.ts` with a skeleton.

### 2. Define outcome interface

```typescript
export interface ConnectDatabaseOutcome {
  databaseId: number;
  databaseName: string;
}
```

### 3. Implement fixture

The fixture produces the same end-state as the flow but programmatically (direct DB/API). Used when downstream tests need this outcome without running the browser.

```typescript
fixture: async (context, params) => {
  const loginData = context.get(login(params.user as string));
  // Direct DB query or API call to connect the database
  const databaseId = await connectDatabaseViaApi(
    BASE_URL, loginData.sessionId, params.database as string
  );
  return { databaseId, databaseName: params.database as string };
},
```

### 4. Implement flow

The flow is the actual browser test. Start with navigation, use Page Objects, end with assertions.

```typescript
flow: async (page, context, params) => {
  const loginData = context.get(login(params.user as string));
  await setupAuth(page, loginData);
  await page.goto('/');
  // ... browser interactions using Page Objects ...
  await expect(page.locator('.database-name')).toContainText(params.database as string);
},
```

### 5. Validate

```bash
npm run validate-dag      # check for cycles/conflicts
npm run list-outcomes     # see all outcomes
```

## Page Object Model Rules

- POMs expose **actions** (verbs) and **locators** (nouns), NEVER assertions.
- Tests decide what to assert. POMs are reusable.
- When a selector breaks, fix it in one POM, not in 15 test files.
- Tests should never contain raw selectors — always use POM locators.
- Place in `mathesar/pages/`. Component POMs (Modal, Dropdown) go in `mathesar/pages/components/`.

```typescript
// Good POM
class TablePage {
  readonly columnHeader = (name: string) => this.page.locator(`th:has-text("${name}")`);
  async addColumn(name: string, type: string) { /* clicks, fills */ }
}

// In test flow:
const tablePage = new TablePage(page);
await tablePage.addColumn('amount', 'numeric');
await expect(tablePage.columnHeader('amount')).toBeVisible();
```

## DB Helpers (mathesar/db/)

`client.ts` provides a pooled Postgres connection using env vars (`POSTGRES_HOST`, `POSTGRES_PORT`, `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`).

`queries.ts` contains reusable SQL helpers:
- `createSuperuser(username, password)` — inserts into `mathesar_user` with Django-compatible password hash (PBKDF2-SHA256, 720k iterations). Idempotent via `ON CONFLICT`.
- `loginViaHttp(baseUrl, username, password)` — performs Django CSRF dance (GET page → extract token → POST credentials → capture rotated token). Returns `{ sessionId, csrfToken }`.

Add new query helpers here as fixtures need them.

## Scripts

| Command | Purpose |
|---|---|
| `npm run test` | Run tests via screenwriter wrapper (generate → validate → playwright). |
| `npm run validate-dag` | Check cycles, missing outcomes, write conflicts. Exit 1 on error. |
| `npm run list-outcomes` | Table of all outcomes, producers, and consumers. |
| `npm run visualize-dag` | Mermaid diagram of the DAG. |
| `npm run scaffold -- --code <code> ...` | Generate test skeleton. |
| `npm run generate` | Manually regenerate `.generated/` runners. |

## Docker Setup

Three containers in `docker-compose.e2e.yml`:
- `e2e-db` — PostgreSQL (credentials: `mathesar`/`mathesar`, db: `mathesar_django`)
- `e2e-service` — Mathesar app (built from production Dockerfile)
- `e2e-test-runner` — Playwright (built from `e2e_tests/Dockerfile`)

Test runner has direct DB access via env vars. Volume mounts for dev: `framework/`, `mathesar/`, `test-results/`, `playwright-report/`.

`.generated/` is NOT mounted — it's created inside the container by the screenwriter wrapper at runtime. No rebuild needed to add tests.

## Rules and Pitfalls

1. **File name = test code.** `install.ts` must use `code: 'install'`.
2. **No `page.waitForTimeout()`.** Use Playwright's auto-waiting and auto-retrying assertions (`await expect(locator).toBeVisible()`).
3. **Flows start with navigation.** Never assume current page state after fixture resolution.
4. **Fixtures must be idempotent** or use `ON CONFLICT` / check-before-create patterns.
5. **Outcome data is the contract** between fixture and flow. Both must produce data matching the same TypeScript interface.
6. **Changing a param default changes outcome codes** for all downstream tests. Treat as API change.
7. **Two unrelated `write` consumers = validation error.** Use serial chains or isolated resources.
8. **No auto-cleanup.** Docker teardown handles it. Don't add cleanup logic in fixtures.
9. **Unique resource names in fixtures** to avoid collisions in parallel branches: `test_table_${testCode}_${Date.now()}`.
10. **Don't edit `.generated/` files.** They're overwritten on every test invocation.
11. **Read outcome data, don't hardcode.** Use `context.get(handle)` to get IDs, names, etc. from dependencies.
