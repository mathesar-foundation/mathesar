# Mathesar E2E Testing Framework

## Quick Reference

```
e2e_tests/
  framework/          # Generic, self-contained, extractable test framework
    src/              # Framework source code
      engine/         # Orchestration: defineTest, dry-run, executor, DAG, global setup
      store/          # Data management: registry, outcome store
      __tests__/      # Framework unit & integration tests (Vitest)
      config.ts       # Config types, validation, createPlaywrightConfig(), getBaseURL()
      types.ts        # Type definitions (TestHandle, ScenarioContext, StepNode)
      index.ts        # Public API re-exports
    scripts/          # CLI tools
      screenwriter.ts # Main wrapper — orchestrates generate → dry-run → validate → run
      generate-runners.ts
      scaffold-test.ts
      validate-dag.ts
      list-outcomes.ts
      visualize-dag.ts
      load-config.ts
    vitest.config.ts  # Vitest config for framework tests
  mathesar/           # Mathesar-specific test code
    tests/            # Test definitions — ONE file per test (you write these)
    pages/            # Page Object Models
    db/               # Postgres client + SQL helpers
  .generated/         # Auto-generated Playwright runners (gitignored)
```

**To add a test:** create `mathesar/tests/<code>.ts` with `defineTest()`. That's it — the wrapper auto-generates runners and validates the DAG on every `npm run test`.

**Convention:** file name = test code. `install.ts` must contain `defineTest({ code: 'install', ... })`.

## Running Tests

```bash
npm run test              # run all e2e tests (headless)
npm run test:headed       # run with browser visible
npm run test:debug        # run in debug mode
npm run test:framework    # run framework unit tests (Vitest, no browser)
```

The `npm run test` command invokes the screenwriter wrapper (`framework/scripts/screenwriter.ts`), which orchestrates:
1. Load configuration from `screenwriter.config.ts`
2. Generate Playwright runner files in `.generated/`
3. Load test definitions and dry-run all scenarios
4. Build and validate the DAG from captured step trees
5. Spawn Playwright to execute tests

## Framework Concepts

### Composable Scenarios

Every test is a **scenario** — an async function that receives a `t` context object and optional params, and returns typed outcome data. Scenarios compose other scenarios via `t.step()`.

```typescript
import { z } from 'zod';
import { defineTest } from '../../framework/src';

export const myTest = defineTest({
  code: 'my-test',
  params: z.object({ name: z.string() }),
  outcome: z.object({ id: z.number() }),

  scenario: async (t, params) => {
    // Compose other tests as sub-steps
    await t.step('Login to Mathesar', login, { user: 'admin', password: 'admin' });

    // Perform browser actions that produce data
    const result = await t.action('Create resource', z.object({ id: z.number() }), async (page) => {
      await page.goto('/');
      // ... browser interactions ...
      return { id: 42 };
    });

    // Assert browser state
    await t.check('Verify resource visible', async (page) => {
      await expect(page.getByText(params.name)).toBeVisible();
    });

    // Return typed outcome
    return { id: result.id };
  },

  standalone: { params: { name: 'Test' } },
});
```

### The `t` Context Object

The scenario function receives a `t` (ScenarioContext) with three methods:

| Method | Purpose | Returns |
|--------|---------|---------|
| `t.step(label, testHandle, params)` | Compose another test as a sub-step | That test's typed outcome |
| `t.action(label, schema, closure)` | Run browser code that produces data | Validated data matching schema |
| `t.check(label, closure)` | Run browser assertions | void |

**Every call requires a descriptive label** as the first argument. Labels serve as DAG node names and human-readable documentation.

### Zod Schemas

Every test declares `params` and `outcome` Zod schemas:

```typescript
const myParams = z.object({ user: z.string(), password: z.string() });
const myOutcome = z.object({ sessionId: z.string() });

defineTest({
  code: 'my-test',
  params: myParams,
  outcome: myOutcome,
  // TypeScript infers params and outcome types from schemas
  scenario: async (t, params) => {
    // params is { user: string; password: string }
    return { sessionId: '...' }; // validated against myOutcome
  },
});
```

- **Params schema** — validates standalone params at registration time, and execution-time params
- **Outcome schema** — validates the scenario's return value at execution time
- **Action schemas** — each `t.action()` declares a return schema, validated at execution time

### Dry-Run & Static Analysis

Before any browser opens, the framework **dry-runs** each scenario:

1. Generates fake params from the Zod schema (e.g., `z.string()` → `"fake_string"`)
2. Calls the scenario with a **recorder** `t` that:
   - `t.step()` → recursively dry-runs the sub-scenario, returns fake outcome
   - `t.action()` → **skips the closure**, returns fake data from schema
   - `t.check()` → **skips the closure**
3. Records the step tree: which steps, in what order, with what labels

This captures the full **step tree** — the DAG of test composition — without touching a browser.

**Why it works:** All fake values are real typed values (not proxies), so any computation in the scenario body (string concat, method calls, property access) works naturally in both modes.

### No Conditional Steps

Step structure must be **deterministic** regardless of runtime values. The framework enforces this by comparing the dry-run step tree with the execution step tree. If they differ, you get a clear error:

```
Step count mismatch in 'my-test': dry-run had 2 steps, execution had 3.
This usually means your scenario has conditional steps based on runtime values, which is not supported.
```

**Don't do this:**
```typescript
scenario: async (t, params) => {
  const result = await t.action('Get data', schema, async (page) => { ... });
  if (result.needsSetup) {  // ❌ Conditional step!
    await t.step('Extra setup', otherTest, {});
  }
}
```

### Variable Capture (Data Flow)

Steps return typed data that flows naturally:

```typescript
scenario: async (t) => {
  const db = await t.step('Create database', createDatabase, {
    name: 'Library',
    login: { user: 'admin', password: 'admin' },
  });

  // db.databaseName is a real typed value
  const table = await t.step('Import table', createTableFromImport, {
    database: db.databaseName,  // data flows between steps
    name: 'Books',
  });

  return { databaseName: db.databaseName, tableName: table.tableName };
}
```

### Encapsulation

Parent tests only see a child test's **return value**, not its internal step outcomes. A child test's internal actions, checks, and sub-steps are opaque to the parent.

### Standalone Config

Tests that can be run independently need a `standalone` section:

```typescript
standalone: {
  params: { user: 'admin', password: 'admin' },
}
```

Tests without `standalone` can only be used as sub-steps via `t.step()`.

## How to Write a New Test

### 1. Scaffold

```bash
cd e2e_tests
npm run scaffold -- --code connect-database --requires login
```

Creates `mathesar/tests/connect-database.ts` with a skeleton.

### 2. Define schemas

```typescript
const connectDatabaseParams = z.object({
  name: z.string(),
  login: z.object({ user: z.string(), password: z.string() }),
});

const connectDatabaseOutcome = z.object({
  databaseId: z.number(),
  databaseName: z.string(),
});
```

### 3. Implement scenario

```typescript
scenario: async (t, params) => {
  // Compose: log in first
  await t.step('Login', login, params.login);

  // Action: browser interactions that produce data
  const result = await t.action('Connect database', connectDatabaseOutcome, async (page) => {
    await page.goto('/');
    // ... fill form, click buttons ...
    return { databaseId: 1, databaseName: params.name };
  });

  // Check: assertions
  await t.check('Database appears in sidebar', async (page) => {
    await expect(page.getByText(params.name)).toBeVisible();
  });

  return { databaseId: result.databaseId, databaseName: result.databaseName };
},
```

### 4. Validate

```bash
npm run validate-dag      # check for cycles/missing references
npm run test:framework    # run framework unit tests
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

// In test scenario:
await t.action('Add column', schema, async (page) => {
  const tablePage = new TablePage(page);
  await tablePage.addColumn('amount', 'numeric');
  return { columnName: 'amount' };
});
await t.check('Column visible', async (page) => {
  const tablePage = new TablePage(page);
  await expect(tablePage.columnHeader('amount')).toBeVisible();
});
```

## DB Helpers (mathesar/db/)

`client.ts` provides a pooled Postgres connection using env vars (`POSTGRES_HOST`, `POSTGRES_PORT`, `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`).

`queries.ts` contains reusable SQL helpers:
- `createSuperuser(username, password)` — inserts into `mathesar_user` with Django-compatible password hash (PBKDF2-SHA256, 720k iterations). Idempotent via `ON CONFLICT`.
- `loginViaHttp(baseUrl, username, password)` — performs Django CSRF dance (GET page → extract token → POST credentials → capture rotated token). Returns `{ sessionId, csrfToken }`.

Add new query helpers here as needed.

## Scripts

| Command | Purpose |
|---|---|
| `npm run test` | Run e2e tests via screenwriter wrapper (generate → dry-run → validate → playwright). |
| `npm run test:framework` | Run framework unit tests with Vitest (no browser needed). |
| `npm run validate-dag` | Dry-run all tests, build DAG, check cycles/missing references. Exit 1 on error. |
| `npm run list-outcomes` | Table of all registered tests and their composition structure. |
| `npm run visualize-dag` | Mermaid diagram of the DAG showing test composition. |
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
3. **No conditional steps.** Step structure must be deterministic. Don't wrap `t.step()`, `t.action()`, or `t.check()` in conditionals based on runtime values.
4. **Every action returns data.** Even if it's just `return {}` with `z.object({})`. Actions always declare a schema for their return value.
5. **Scenarios always return data.** Validated against the declared outcome Zod schema.
6. **Labels are mandatory.** Every `t.step()`, `t.action()`, and `t.check()` has a human-readable label as the first argument.
7. **Don't edit `.generated/` files.** They're overwritten on every test invocation.
8. **Data flows via return values.** Use `const result = await t.step(...)` and access `result.field`. No external stores or context objects.
9. **No auto-cleanup.** Docker teardown handles it. Don't add cleanup logic.
10. **Unique resource names** to avoid collisions in parallel branches.
