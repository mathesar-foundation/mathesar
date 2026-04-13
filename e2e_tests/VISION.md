# Screenwriter: Vision, Decisions, and Roadmap

## 1. Purpose

Screenwriter is a composable e2e testing framework built on Playwright. Its test suite serves as a **living specification of the application's behavior** — both a verification tool and a reviewable document of what the app does.

The framework is designed for two audiences:
- **LLMs** that write and maintain tests (optimized for first-shot correctness)
- **Humans** that review test changes (optimized for low cognitive overhead)

## 2. Long-Term Vision

The test suite becomes the **platform for reviewing any change** to the application:

1. When code changes, the system identifies which areas of the UI are affected
2. Existing tests are run against the new code, with screenshots captured at every step
3. Failures are diagnosed: genuine bug vs. stale test vs. flake
4. Stale tests are updated with evidence (before/after screenshots, code diff)
5. Everything is presented to developers for review — screenplay diffs, visual comparisons, DAG impact

The LLM acts as an **automated QA engineer** — it observes the application, makes decisions about what to test and how, and submits its work for human review. It uses Screenwriter as its working medium.

The framework itself runs **without an LLM**. Tests are plain TypeScript that Playwright executes. The LLM is the author and maintainer, not part of the runtime.

## 3. Design Principles

### 3.1 Strict harness with mechanical verification

The framework constrains the LLM's output space through mechanical checks:

- **Zod schema validation** at every boundary (params, outcomes, action returns)
- **Step tree comparison** (dry-run vs. execution) catches non-determinism and conditional steps
- **DAG validation** catches cycles, missing references, structural errors
- **Browser state detection** warns when a test modifies state without a restore hook
- **Cache key determinism** ensures deduplication correctness
- **TypeScript generics** provide compile-time type safety

These checks make hallucination mechanically detectable. If an LLM writes a bad schema, Zod rejects it. If it writes conditional steps, the tree comparison catches it. The framework doesn't need to understand intent — it validates structure.

### 3.2 LLM as observer and decision maker

The LLM has three capabilities for test authoring:
1. **Read code** — understand app components, routes, data flow
2. **Browse the UI** — use playwright-cli to see what's rendered, try interactions
3. **Write tests** — encode discoveries into the framework's strict API

The LLM's role:
- Decide what to test (which user flows matter)
- Decide how to compose (which existing tests to reuse)
- Discover UI interactions (by reading code + browsing the app)
- Write correct Playwright code (informed by actual UI observation)
- Maintain tests when the app changes (diagnosis + surgical fixes)

The LLM does NOT:
- Execute at runtime (tests are plain TypeScript)
- Make structural decisions that bypass the framework (the harness constrains it)

### 3.3 Tight feedback loop that converges

The test-writing cycle must quickly converge on correct tests:

1. **Dry-run** (no browser) — catches structural errors, schema mismatches, DAG issues
2. **Type check** — catches type errors in data flow
3. **Run test** (browser) — catches interaction errors, selector issues
4. **Compare with baseline** — catches regressions

Each cycle narrows the error space. The framework's error messages must be actionable — "Step count mismatch in 'add-user': dry-run had 3 steps, execution had 4" tells the LLM exactly what to fix.

### 3.4 Composability is the core product

What Screenwriter uniquely provides:
- **Typed test composition** — `t.step()` with Zod-validated data flow
- **DAG-based execution** — parallel scheduling, caching, dependency tracking
- **Review artifacts from the DAG** — screenplays, visualizations, diffs

What Screenwriter does NOT prescribe:
- How to interact with the UI (bring your own selectors, POMs, helpers)
- What selector strategy to use (the app determines this)

The framework is **opinionated about structure** (composability, DAG, types, caching) and **unopinionated about UI interaction** (Playwright is the escape hatch, not a limitation).

## 4. Architecture: Tests All The Way Down

There is one concept: `defineTest`. It serves both atomic interactions and composite journeys.

### Atomic tests (the interaction layer)

Small, focused tests with a single `t.action()`. They encapsulate one UI workflow and are compose-only (no `standalone`).

```typescript
// mathesar/tests/atoms/grid-add-record.ts
export const gridAddRecord = defineTest({
  code: 'grid-add-record',
  description: 'Add a new record to the currently visible data grid',
  params: z.object({ columnIndex: z.number(), value: z.string() }),
  outcome: z.object({ value: z.string() }),
  scenario: async (t, params) => {
    return await t.action('Add record', schema, async ({ page }) => {
      // Single, focused UI interaction
      // ...
      return { value: params.value };
    });
  },
  // No standalone — compose-only
});
```

### Composite tests (user journeys)

Compose atomic tests and other composite tests via `t.step()`. Most of the code is wiring, not Playwright.

```typescript
// mathesar/tests/add-table-record.ts
export const addTableRecord = defineTest({
  code: 'add-table-record',
  description: 'Navigate to a table and add a new record',
  scenario: async (t, params) => {
    const db = await t.step('Connect database', connectDatabase, { ... });
    await t.step('Navigate to table', navigateToTable, { ... });
    const record = await t.step('Add record', gridAddRecord, { ... });
    await t.check('Record visible', async ({ page }) => {
      await expect(page.getByText(record.value)).toBeVisible();
    });
    return { tableName: params.tableName, recordName: record.value };
  },
  standalone: { params: { ... } },
});
```

### The compounding effect

Each atomic test makes future tests cheaper:
- **Early:** Many atomic tests need writing, composite tests have action closures
- **Growth:** Atomic catalog grows, new composite tests are mostly `t.step()` calls
- **Maturity:** New tests are 90%+ composition. UI changes only break atomic tests.

## 5. Tiered Abstraction

Tests naturally fall into tiers based on how much Playwright code they contain:

**Tier 1 — Pure composition:**
Only `t.step()` calls. No browser code. Near-zero review effort. Highest LLM success rate.

**Tier 2 — Thin action closures:**
`t.step()` + small `t.action()`/`t.check()` closures. Uses POMs or helpers. Moderate review effort.

**Tier 3 — Complex imperative closures:**
Raw Playwright for interactions that can't be simplified (virtual scrolling, drag-drop, complex modals). Full code review required. Should be rare.

The framework nudges toward Tier 1:
- Build atomic tests early (Tier 2) so that future tests compose them (Tier 1)
- The test catalog makes composition discoverable
- Tier 3 should be wrapped into reusable atomic tests whenever possible

## 6. Review and Visualization

Three review mechanisms, serving different contexts:

### 6.1 PR Screenplay (quick review)

Auto-generated PR comment showing what each test does:

```
add-user (level 2) — Composes: login x3
  1. [step]   Login as admin → login(user, password)
  2. [action] Create a new user via admin page
  3. [check]  New user appears in the users list
  4. [action] Log out current admin session
  5. [step]   Login as the new user → login(user, password)
  6. [action] Complete forced password change
  7. [step]   Login with updated password → login(user, password)
  8. [check]  New user sees the databases page
  Returns: {username, password}
```

Three symbols communicate tier instantly:
- **[step]** — composed sub-test (Tier 1 territory, reviewer trusts it)
- **[action]** — browser interaction (review focus here)
- **[check]** — assertion (reviewer validates coverage)

### 6.2 DAG Diff (impact understanding)

Shows how the test graph changed when tests are added/modified:

```
DAG Change:
  install → login → connect-database → add-table-record
                  ↘ add-user ← NEW (leaf)

Modified: login
  Downstream impact: connect-database, add-user, add-table-record (3 tests)
```

### 6.3 Interactive HTML Report (deep review)

A navigable report with:
- Full DAG visualization — click any node to see its screenplay
- Expandable step trees — click a composed step to see its internals
- Screenshots at each step — visual verification
- Outcome inspector — see actual data each test produced
- Before/after comparison — when comparing with a previous run

## 7. LLM Test-Authoring Context

For LLMs to write tests effectively, they need:

### 7.1 Test catalog (auto-generated)

```
## Test Catalog

### Atomic (compose-only)
grid-add-record(columnIndex, value) → {value}
  Add a new record to the currently visible data grid
navigate-to-table(dbName, schemaName, tableName) → {tableName}
  Navigate from databases page to a specific table

### Composite (standalone)
install() → {username, password}
  Complete Mathesar installation wizard
login(user, password) → {username, password}  [has restore]
  Log in with credentials
connect-database(login, databaseName, sampleSchema) → {databaseName, ...}
  Connect internal database with sample schema
```

### 7.2 App source code pointers

CLAUDE.md references to key app directories and components, so LLMs can read component code to understand the UI.

### 7.3 UI browsing via playwright-cli

LLMs can use the playwright-cli skill to:
- Navigate to pages and see what's rendered
- Try interactions and observe results
- Verify selectors before encoding them in tests

### 7.4 Existing test patterns

LLMs copy patterns from existing tests. The more well-written tests exist, the better LLMs write new ones.

## 8. Historical State and QA Agent (Long-Term)

### 8.1 Run history

Each test run stores:
- Metadata (git SHA, timestamp, pass/fail counts)
- Per-test: screenplay, outcome data, screenshots per step, Playwright traces
- DAG structure snapshot

### 8.2 Comparison tools

- Screenplay diff between runs
- Visual diff (screenshot comparison)
- Outcome diff (data changes)
- DAG diff (structural changes)

### 8.3 QA Agent workflow

The automated QA engineer (future capability):
1. Detect code changes → predict affected tests
2. Run tests → capture results with screenshots
3. Compare with previous run → identify changes
4. Diagnose failures → bug vs. stale test vs. flake
5. Fix stale tests → update selectors, adjust interactions
6. Submit for review → screenplay diffs, visual comparisons, code changes

## 9. Step-by-Step Roadmap

This is an iterative process. Build capabilities step by step while covering Mathesar's tests to a full extent.

**Phase 1: Solidify the core (current)**
- The existing framework (defineTest, t.step/action/check, Zod schemas, DAG, caching, restore hooks) is architecturally sound
- Write more Mathesar tests to validate the architecture against real use cases
- Build atomic tests for common interactions as they're needed
- Refine error messages for the tight LLM feedback loop

**Phase 2: Review tooling**
- Screenplay generation from dry-run step trees
- DAG visualization (Mermaid) improvements
- PR comment generation (CI integration)
- HTML report with step-by-step screenshots

**Phase 3: LLM authoring optimization**
- Auto-generated test catalog (included in CLAUDE.md or referenced file)
- Auto-generated POM/helper catalog
- App source code pointers in CLAUDE.md
- "Run single test" mode for fast iteration
- Validate the LLM write → run → fix → run loop

**Phase 4: Historical state**
- Store run history (screenshots, outcomes, screenplays)
- Comparison tools (screenplay diff, visual diff)
- Before/after reports

**Phase 5: QA Agent capabilities**
- Component-to-test mapping
- Impact analysis from code changes
- Automated test maintenance (diagnose + fix)
- Full QA report generation

**Phase 6: Open-source extraction**
- Package Screenwriter as a standalone npm module
- Separate framework (generic) from Mathesar-specific code
- Configuration, documentation, examples
- Public API stabilization

## 10. Open Questions (Future Discussions)

- **Failure semantics & retries:** When a test in the DAG fails, should only its dependents be blocked (per-test deps) or the whole level? How do retries interact with caching?
- **Cache invalidation:** Within a run the cache is safe. Should there be a `--no-cache` mode for debugging? Cross-run caching?
- **Read/write access modes:** Deferred from the original design. When two tests at the same level both mutate a shared resource, how to detect and handle conflicts?
- **Fixtures (fast programmatic setup):** When composition chains get deep, running every ancestor through the browser is slow. Programmatic shortcuts?
- **Scaling to hundreds of tests:** Does the level-based DAG execution become too coarse? Per-test Playwright projects?
- **Atomic test caching semantics:** Navigation-only atomic tests don't benefit from caching (the restore hook just re-navigates). Should some tests opt out of caching?
- **Declarative DSL for simple interactions:** Should the framework offer a declarative alternative to imperative action closures for simple interactions (click, fill, navigate)?

## 11. Design Journey

The framework evolved through several iterations:

**Original model (replaced):** Fixture/flow duality with `requires` dependencies. Each test had a programmatic setup path (fixture) and a browser test path (flow). The `requires` system only ran fixtures, never flows — browser flows couldn't compose each other.

**Explored and rejected:**
- **Proxy/Ref tokens** — return proxy objects from t.step() as placeholders during dry-run. Rejected: proxies are fragile with toString(), valueOf(), template literals. Debugging is painful.
- **Separate structure declaration** — declare step structure separately from scenario body. Rejected: duplication between declaration and scenario, lost natural sequential reading.
- **Resource-based models** (typed declarations, factories, mutable containers, identity+verbs) — all explored, all rejected as over-engineering before real pain points emerged.
- **State machine models** — explicitly rejected. State machines look good on paper but are terrible for frontend/e2e testing in practice.
- **Auto-detection of read/write access** — infeasible. The framework can't know what a flow does to a dependency's resource at static analysis time.

**What won: Zod-fake dry-run.** Generate real typed values from Zod schemas during dry-run. One scenario function runs in two modes (recorder vs executor). No proxies, computation works naturally, step tree captured for DAG and determinism enforcement.

**Key architecture (current):**
- `defineTest()` returns a `TestHandle` with Zod-typed params, outcomes, and optional restore hook
- Scenarios use `t.step()`, `t.action()`, `t.check()` — all with mandatory labels
- Static analysis via dry-run with Zod-generated fake values
- Step tree determinism enforcement: dry-run vs execution tree comparison
- `t.step()` caches outcomes: same test + same params = cache hit
- Cache keys: `testCode:sha256(stableStringify(params))`
- Restore hooks reconstruct browser state from cached outcomes (transitive)
- Browser state detection: framework snapshots storageState() before/after, warns if changed without restore hook
- Level-based execution: Playwright project dependencies group tests by DAG level

**The failure-mode argument (for future reference):**
If read/write modes are ever revisited:
- Default=read → forget `.write()` → **flaky tests** (bad, hard to debug)
- Default=write → forget `.read()` → **slow tests** (acceptable, easy to fix)
Safe-by-default (default=write) is the stronger position.

## 12. Decisions Log

| Decision | Rationale |
|----------|-----------|
| Composable scenarios with `t.step()` | Replaced fixture/flow model. Allows browser flows to compose each other. |
| Zod-fake dry-run (not proxies) | Proxies are fragile. Real typed values from Zod schemas work naturally in all contexts. |
| No conditional steps (determinism) | Step tree comparison catches non-determinism. Simplifies static analysis and DAG building. |
| No state machine models | Rejected for e2e testing — terrible in practice despite looking good on paper. |
| Always compose via `t.step()` | Never reimplement existing test logic in `t.action()`. Composability is the core principle. |
| Tests all the way down | One concept (defineTest) for both atomic interactions and composite journeys. No separate "interaction" abstraction. |
| Framework = strict harness | Mechanical verification prevents LLM hallucination. LLM works within the rails, not around them. |
| LLM = observer + decision maker | LLM reads code, browses UI, writes tests. Framework validates. LLM is not part of runtime. |
| Per-domain interaction grouping | When organizing atomic tests, group by user workflow domain, not by page. |
| Three review mechanisms | PR screenplay (quick), DAG diff (impact), HTML report (deep). |

## 13. Key Constraints

- The app (Mathesar) doesn't have comprehensive a11y attributes. Tests may need data-testid, text-based, or structural selectors.
- The app is highly dynamic — static crawling of the UI is not feasible. LLMs must interact with the running app to discover UI elements.
- Tests must run without an LLM present. The LLM is the author, not the executor.
- Every action the LLM takes (writing tests, updating tests, reporting issues) must be reviewable by developers.
