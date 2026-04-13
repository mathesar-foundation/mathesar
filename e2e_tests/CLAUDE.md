# Mathesar E2E Testing Framework

> **For vision, design decisions, and roadmap see [VISION.md](VISION.md).**

## Quick Reference

```
e2e_tests/
  framework/          # Generic, self-contained, extractable test framework
    src/              # Framework source code
      engine/         # Orchestration: defineTest, dry-run, executor, DAG, caching, restore
      store/          # Data management: registry, outcome store
      __tests__/      # Framework unit & integration tests (Vitest)
      config.ts       # Config types, validation, createPlaywrightConfig()
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
    interactions/     # Interaction objects (replaces Page Object Models)
      components/     # Generic UI primitives — reusable base classes (Modal, DataGrid)
      regions/        # Pages (Page-scoped entry points) and feature-specific regions
    db/               # Postgres client + SQL helpers
  .output/            # All generated/output files (gitignored)
    playwright.config.ts  # Auto-generated Playwright config
    runners/          # Auto-generated Playwright test runners
    outcomes/         # Cached test outcome data
    test-results/     # Playwright artifacts (traces, screenshots, videos)
    playwright-report/  # HTML test report
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
2. Load test definitions and dry-run all scenarios
3. Build and validate the DAG from captured step trees
4. Compute execution levels from the DAG
5. Generate Playwright runner files grouped by level in `.output/runners/phase-N/`
6. Generate a dynamic Playwright config with project dependencies
7. Spawn Playwright — each phase runs after its dependencies complete

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
    const result = await t.action('Create resource', z.object({ id: z.number() }), async ({ page }) => {
      await page.goto('/');
      // ... browser interactions ...
      return { id: 42 };
    });

    // Assert browser state
    await t.check('Verify resource visible', async ({ page }) => {
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

### Caching & Deduplication

When `t.step()` composes a sub-test, the framework checks the **outcome store** before executing. If the sub-test has already run with the same params (same test code + same params = same cache key), the cached outcome is returned immediately — the sub-test's closures do NOT re-execute.

Cache keys are `testCode:hash(params)`. The hash uses deterministic JSON serialization (sorted keys at every level) + SHA-256, so `{user: "a", pass: "b"}` and `{pass: "b", user: "a"}` produce the same key.

**How caching works in practice:**
1. `install` runs standalone in phase-0 → outcome cached
2. `login` runs in phase-1, calls `t.step('Install', install, {})` → cache hit, install not re-executed
3. Both tests pass, install only ran once

### Restore Hooks (Browser State)

When a sub-step is cached and skipped, any browser state it would have produced (cookies, localStorage) is lost because each test gets a fresh page. The `restore` hook reconstructs browser state from cached outcome data.

```typescript
export const login = defineTest({
  code: 'login',
  params: loginParams,
  outcome: loginOutcome,

  // Called on cache hit to establish a fresh authenticated session
  restore: async ({ page, baseURL }, outcome) => {
    await page.request.get(`${baseURL}/auth/login/`);
    const cookies = await page.context().cookies();
    const csrfToken = cookies.find((c) => c.name === 'csrftoken')?.value;

    await page.request.post(`${baseURL}/auth/login/`, {
      form: {
        username: outcome.username,
        password: outcome.password,
        csrfmiddlewaretoken: csrfToken ?? '',
      },
      headers: { Referer: `${baseURL}/auth/login/` },
    });
  },

  scenario: async (t, params) => { /* ... */ },
  standalone: { params: { user: 'admin', password: 'mathesar_password' } },
});
```

**Restore hook rules:**
- **Optional** — only needed for tests that modify browser state (cookies, localStorage)
- **Producer-side** — defined on `defineTest()`, not on the `t.step()` call site
- **Essential state only** — set cookies/localStorage or re-establish sessions programmatically, do NOT navigate
- **Transitive** — when a cached test has sub-steps with restore hooks, the framework calls ALL restore hooks in dependency order (deepest first). If test C composes B which composes login, and C is cached, the framework calls `login.restore → B.restore → C.restore`.
- **Browser state detection** — the framework automatically detects when a test modifies browser state but has no restore hook, and emits a warning

**Convention:** Test authors should NOT rely on browser state from composed sub-steps. After `t.step()`, always navigate explicitly. Use outcome data (not page state) to drive subsequent actions.

### Level-Based Parallel Execution

The framework computes **execution levels** from the DAG:
- Level 0: tests with no dependencies (e.g., `install`)
- Level 1: tests whose dependencies are all level 0 (e.g., `login`)
- Level N: tests whose dependencies are all level < N

Each level becomes a Playwright project. Level N depends on level N-1. Tests within a level run in **parallel** across workers. This means:
- `install` runs first (phase-0)
- `login` runs next (phase-1)
- `create-database` and `create-table` run in parallel (phase-2)

### Tiered Abstraction

Tests fall into tiers based on how much Playwright code they contain:

| Tier | Contains | Review effort | LLM success rate |
|------|----------|---------------|------------------|
| **Tier 1** — Pure composition | Only `t.step()` calls, no browser code | Near-zero | Highest |
| **Tier 2** — Thin action closures | `t.step()` + small `t.action()`/`t.check()` using interaction objects | Moderate | High |
| **Tier 3** — Complex imperative | Raw Playwright for interactions that can't be simplified | Full review | Lower |

The framework nudges toward Tier 1: build atomic tests early (Tier 2) so future tests compose them (Tier 1). Tier 3 code should be wrapped into reusable atomic tests whenever possible. See [VISION.md § 5](VISION.md#5-tiered-abstraction) for details.

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
  const result = await t.action('Connect database', connectDatabaseOutcome, async ({ page }) => {
    await page.goto('/');
    // ... fill form, click buttons ...
    return { databaseId: 1, databaseName: params.name };
  });

  // Check: assertions
  await t.check('Database appears in sidebar', async ({ page }) => {
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

### Atomic Tests (compose-only)

Atomic tests encapsulate a single UI interaction and have no `standalone` config — they can only be used as sub-steps via `t.step()`. Place them in `mathesar/tests/atoms/`.

```typescript
export const gridAddRecord = defineTest({
  code: 'grid-add-record',
  description: 'Add a new record to the currently visible data grid',
  params: z.object({ columnIndex: z.number(), value: z.string() }),
  outcome: z.object({ value: z.string() }),
  scenario: async (t, params) => {
    return await t.action('Add record', schema, async ({ page }) => {
      // Single, focused UI interaction
      return { value: params.value };
    });
  },
  // No standalone — compose-only
});
```

Build atomic tests for repeated interactions so composite tests can compose them via `t.step()` rather than reimplementing the interaction. See [VISION.md § 4](VISION.md#4-architecture-tests-all-the-way-down) for the "tests all the way down" philosophy.

## Interaction Objects

Interaction objects model **what the user sees and does**, not app internals. They replace the Page Object Model with a composable, locator-scoped tree. If the app is rewritten, the public API stays stable — only internal selectors change.

### Three Kinds of Objects

| Kind | Constructor | Purpose | Directory |
|------|-------------|---------|-----------|
| **Page** | `Page` | Where the user IS — a navigation target/page entry point | `interactions/regions/` (`.page.ts` suffix) |
| **Region** | `Locator` | What the user interacts WITH — a feature-specific bounded UI area | `interactions/regions/` |
| **Component** | `Locator` | Generic, reusable UI primitive (Modal, DataGrid) — not tied to any feature | `interactions/components/` |

Pages are thin wrappers that compose regions and components. Components are reusable across pages and regions.

### Three-Part Vocabulary

Each object exposes:
- **Locators** — elements the user can see (getters returning `Locator`)
- **Actions** — things the user can do (async methods)
- **State observations** — things the user can wait for (async `waitFor*()` methods)

### Rules

1. **Locator-scoped.** Regions and components take `Locator`, pages take `Page`. All queries go through `this.root`/`this.page`.
2. **Never escape scope for queries.** `this.root.page()` only for keyboard/mouse events, never for `locator()` queries. Exception: portaled elements (modals, dropdowns) — documented with a comment.
3. **Child objects via getters/methods.** Lazy creation: `get grid() { return new DataGrid(...); }`. Never pre-create in constructor.
4. **No assertions.** Objects expose locators and perform actions. Tests assert. `waitFor*()` methods are state observations, not assertions.
5. **Pages are thin.** If significant interaction logic creeps in, extract a region or component.
6. **One file per interaction domain.** `DataGrid` + `DataRow` + `DataCell` share `data-grid.ts`.
7. **User perspective naming.** Name objects and methods for what the user sees/does, not implementation details.
8. **Prefer ARIA selectors.** Use `getByRole`, `getByText`, `getByLabel` before falling back to data attributes or CSS.
9. **Primitives only, no convenience methods.** Regions expose fine-grained primitives. Multi-step workflows belong in atomic tests (`defineTest` + `t.step()`), not as convenience methods on regions.

### Selector Priority

ARIA roles/labels > text content > existing data attributes (`data-sheet-element`) > structural selectors.

No app changes for selectors. If a selector proves brittle, ask before adding new attributes.

### Pattern: Component

```typescript
// interactions/components/data-grid.ts — Locator-scoped, user-perspective API
export class DataGrid {
  constructor(private root: Locator) {}

  // Locators
  get newRecordButton() { return this.root.getByRole('button', { name: 'New Record' }); }
  get unsavedIndicator() { return this.root.getByText('unsaved'); }

  // Child regions
  draftRow() { return new DataRow(this.root.locator('[data-sheet-element="data-row"]').filter({ hasText: 'DEFAULT' }).first()); }
  rowContaining(text: string) { return new DataRow(this.root.locator('[data-sheet-element="data-row"]').filter({ hasText: text })); }

  // Actions
  async addRecord() { await this.newRecordButton.click(); }

  // State observations
  async waitForSaved() { await expect(this.unsavedIndicator).toBeHidden(); }
}
```

### Pattern: Page

```typescript
// interactions/regions/table.page.ts — Page-scoped, thin composition
export class TablePage {
  constructor(private page: Page) {}

  get heading() { return this.page.locator('h1'); }
  get grid() { return new DataGrid(this.page.locator('[data-sheet-element="sheet"]')); }
}
```

### Pattern: Portaled Elements (Modals)

Modals render at body level via `use:portal`. A factory function creates a scoped region:

```typescript
// interactions/components/modal.ts
export function modal(page: Page, titleText: string | RegExp): Modal {
  return new Modal(
    page.locator('[role="dialog"]').filter({
      has: page.getByRole('heading').filter({ hasText: titleText })
    })
  );
}
```

### Usage in Tests

```typescript
await t.action('Add record', schema, async ({ page }) => {
  const table = new TablePage(page);
  await table.grid.addRecord();
  await table.grid.draftRow().cell(1).edit('value');
  await table.grid.waitForSaved();
  return { value: 'value' };
});
await t.check('Record visible', async ({ page }) => {
  const table = new TablePage(page);
  await expect(table.grid.rowContaining('value').element).toBeVisible();
});
```

## DB Helpers (mathesar/db/)

`client.ts` provides a pooled Postgres connection using env vars (`POSTGRES_HOST`, `POSTGRES_PORT`, `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`).

Add SQL query helpers in `queries.ts` as needed.

## Scripts

| Command | Purpose |
|---|---|
| `npm run test` | Run e2e tests via screenwriter wrapper (generate → dry-run → validate → playwright). |
| `npm run test:framework` | Run framework unit tests with Vitest (no browser needed). |
| `npm run validate-dag` | Dry-run all tests, build DAG, check cycles/missing references. Exit 1 on error. |
| `npm run list-outcomes` | Table of all registered tests and their composition structure. |
| `npm run visualize-dag` | Mermaid diagram of the DAG showing test composition. |
| `npm run scaffold -- --code <code> ...` | Generate test skeleton. |
| `npm run generate` | Manually regenerate `.output/runners/` test runners. |

## Docker Setup

Three containers in `docker-compose.e2e.yml`:
- `e2e-db` — PostgreSQL (credentials: `mathesar`/`mathesar`, db: `mathesar_django`)
- `e2e-service` — Mathesar app (built from production Dockerfile)
- `e2e-test-runner` — Playwright (built from `e2e_tests/Dockerfile`)

Test runner has direct DB access via env vars. Volume mounts for dev: `framework/`, `mathesar/`, `.output/`.

`.output/` is mounted as a single Docker volume. All generated files (runners, outcomes, Playwright artifacts, reports) live under this directory. No rebuild needed to add tests.

## Best Practices for Writing Tests

### Check the test catalog before writing new actions

Before writing any `t.action()`, check `mathesar/tests/` (and `mathesar/tests/atoms/`) for an existing test that already covers the interaction. Use the test catalog (when available via `npm run list-outcomes`) or browse the test files. The LLM test-authoring workflow is: read code → browse UI → compose existing tests → write new actions only for uncovered interactions. See [VISION.md § 7](VISION.md#7-llm-test-authoring-context) for the full LLM authoring context.

### Always compose existing tests — never reimplement flows

Before writing any `t.action()`, check `mathesar/tests/` for an existing test that already covers the flow you need. If one exists, use `t.step()` to compose it. This is the most important rule of this framework.

**Why:** Composability is the core design principle. Reimplementing a flow that already exists as a test (e.g., manually filling login fields instead of composing the `login` test) breaks caching, bypasses restore hooks, duplicates maintenance burden, and defeats the DAG. If the original flow changes, every manual copy breaks silently.

**This applies even when:**
- The flow appears in the middle of a larger scenario (e.g., logging in as a different user after a logout)
- The params come from a prior action's return value (dry-run handles this via Zod fakes)
- You only need a subset of what the existing test does (compose it anyway; the outcome gives you what you need)

```typescript
// ❌ BAD — reimplements login inside an action
await t.action('Log in as new user', z.object({}), async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login(username, password);
  return {};
});

// ✅ GOOD — composes the existing login test
await t.step('Login as new user', login, { user: username, password });
```

Only use `t.action()` for a flow when no existing test covers it **and** the flow is too specific to this scenario to warrant its own reusable test.

### Use `t.action()` only for test-specific browser interactions

Actions are for browser interactions unique to this test that produce data. They should not duplicate logic that exists in another test.

### Use `t.check()` for assertions, navigate explicitly

After any `t.step()`, the browser state is undefined (the sub-step may have been cached). Always navigate explicitly in `t.check()` closures rather than assuming a particular page is loaded.

### Design outcomes for downstream consumers

When your test will be composed by others, return data they'll need. Include credentials, IDs, names — anything a downstream test might need to build on your work.

### Keep interaction objects slim and assertion-free

Interaction objects expose locators and actions, never assertions. Tests decide what to assert. Use getters for locators (lazy creation). Use methods for parameterized locators and actions.

```typescript
export class MyPage {
  constructor(private page: Page) {}

  get heading() { return this.page.getByRole('heading', { name: 'My Page' }); }

  itemLink(name: string) { return this.page.getByRole('link', { name }); }
}
```

## Rules and Pitfalls

1. **File name = test code.** `install.ts` must use `code: 'install'`.
2. **No `page.waitForTimeout()`.** Use Playwright's auto-waiting and auto-retrying assertions (`await expect(locator).toBeVisible()`).
3. **No conditional steps.** Step structure must be deterministic. Don't wrap `t.step()`, `t.action()`, or `t.check()` in conditionals based on runtime values.
4. **Every action returns data.** Even if it's just `return {}` with `z.object({})`. Actions always declare a schema for their return value.
5. **Scenarios always return data.** Validated against the declared outcome Zod schema.
6. **Labels are mandatory.** Every `t.step()`, `t.action()`, and `t.check()` has a human-readable label as the first argument.
7. **Don't edit `.output/` files.** They're overwritten on every test invocation.
8. **Data flows via return values.** Use `const result = await t.step(...)` and access `result.field`. No external stores or context objects.
9. **No auto-cleanup.** Docker teardown handles it. Don't add cleanup logic.
10. **Unique resource names** to avoid collisions in parallel branches.
11. **Add restore hooks for tests that modify browser state.** If your test sets cookies or localStorage, add a `restore` function to `defineTest()`. The framework warns if a test changes browser state without a restore hook.
12. **Don't rely on browser state from composed sub-steps.** After `t.step()`, always navigate explicitly. Sub-steps may be cached and their browser effects skipped.
13. **Outcomes should carry forward data needed by downstream restore hooks.** If your test composes a sub-step that modifies browser state, include the data needed for re-establishment in your outcome (e.g., credentials for re-login).
