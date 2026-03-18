# E2E Framework Design Research

Research notes from architectural discussions about handling shared mutable state, test composition, and framework complexity. Captured for reference in future design decisions.

## The Problem

When multiple tests share a mutable resource (e.g., a database table) and run in parallel, one test's mutations can break another. Example: test A deletes a table while test B tries to add a column to it. This introduces flakiness.

The question: how should the framework help test authors avoid this?

## Design Principles (Reference)

These high-level principles guided the discussion:

1. **Fractal Architecture** — No structural difference between a primitive UI click and an end-to-end journey. Both are Test definitions with the same input/output API, allowing infinite composability.
2. **Data as State** — Rely on structural typing. The existence of strictly typed data (e.g., a valid `tableId`) acts as implicit proof of UI state.
3. **Mechanical Verification** — TypeScript generics and Zod schemas form a mathematical contract. Skipping a step or hallucinating data produces a compiler error.
4. **Chronological Linearity** — Within a single flow, execution is strictly sequential. The previous step's token is passed to the next (`t2 = step(t1, ...)`).
5. **Global DAG Orchestration** — The runner builds a global graph, identifies shared paths, executes them once, caches results, and fans out dependent tests in parallel.
6. **Design by Contract** — Every primitive encapsulates both its UI mutation and its post-condition assertion.
7. **Visual Reviewability** — Synchronous variable assignment enables AST-to-diagram mapping (e.g., Mermaid.js for PR reviews).

---

## Current State

The framework already has:
- `.read()` / `.write()` access modes on `RequirementHandle`
- DAG validation that catches two unrelated `.write()` consumers of the same outcome as an error
- Parameterized tests that allow creating multiple instances with different params

The DAG **catches** the problem (write conflict = validation error) but doesn't **solve** it — the test author must resolve the conflict manually.

---

## Approaches Explored

### 1. Read/Write Access Modes (Current Implementation)

Default is `read` (shared, parallel-safe). Author explicitly declares `.write()` for exclusive access. Two unrelated writers on the same outcome = DAG error.

**Resolution options for the author:**
- Chain the writers sequentially (add a dependency between them)
- Use different params so each gets a unique resource instance

**Verdict:** Works but puts the burden on the author to both detect and resolve conflicts.

### 2. Auto-Detection of Access Mode

Can the framework automatically detect whether a test reads or writes a dependency?

**Answer: No.** The framework can't know what a flow does to a dependency's resource — that's runtime behavior inside browser interactions and database operations. Static analysis of fixture/flow code is infeasible for the general case.

The only "auto-detection" is the DAG's write-conflict error, which requires `.write()` to have been declared in the first place — making it circular.

### 3. Write-by-Default with DAG Serialization

Flip the default: all dependencies are `write` (exclusive) by default. The author opts into sharing with `.read()`.

**The failure-mode argument:**
- Current (default=read): Forget `.write()` → **flaky tests** (hard to debug)
- Proposed (default=write): Forget `.read()` → **slow tests** (correct but sequential)

"Slow but correct" is always better than "fast but flaky."

**DAG behavior change:** Instead of erroring on sibling writers, the DAG serializes them — adds artificial ordering edges so they run one at a time.

**Playwright integration:** Group serialized tests into `test.describe.serial` blocks in generated runner files.

**Verdict:** The safety argument is strong. But this led to questions about how serialization interacts with composition, which opened a larger design discussion.

### 4. Composition Within Flows

Instead of the framework externally scheduling tests sequentially (via `test.describe.serial`), tests compose other tests internally within their flow.

```typescript
export const tableLifecycle = defineTest({
  code: 'tableLifecycle',
  requires: () => [login('admin').read()],
  flow: async (page, context) => {
    await context.compose(page, createTable('orders'));
    await context.compose(page, addColumn('amount'));
    await context.compose(page, deleteTable('orders'));
  },
});
```

**How it would work:**
- `context.compose(page, handle)` runs a step's flow within the current browser session
- Stores the step's outcome in the context for downstream steps
- Sequential by physics — single browser = single thread

**Potential issues identified:**
- **Flows return void.** For composition, flows need to return typed outcome data. Breaking API change.
- **Fixture vs. flow when composing.** Should a composed step run its flow (UI) or fixture (programmatic)? Need both options.
- **Requirements validation.** When composing `addColumn` (which requires `createTable`), the framework must verify `createTable`'s outcome is in the context. Runtime check is easy; compile-time check requires a type-level state machine.
- **Browser state.** Each composed step should start with navigation (existing convention). Redundant navigation between steps.
- **Prerequisite mapping.** If `addColumn` hardcodes `requires: [createTable('orders')]` but the composer created `createTable('lifecycle_table')`, how does `addColumn` find its prerequisite?
- **DAG visibility.** Composed steps don't appear as individual DAG nodes. Internal ordering is the author's responsibility.
- **Independent tests sharing resources.** Composition solves related tests (same journey) but not unrelated tests that happen to share a resource.

**Verdict:** Elegant for user journeys, but opens many design questions and doesn't fully solve the original problem.

### 5. Resources as First-Class Concepts

Separate business objects (nouns) from test actions (verbs). Four sub-approaches explored:

#### 5a. Resources as Typed Declarations (Scheduling Only)

Resources are just labels used by the DAG for scheduling. No creation logic.

```typescript
const ordersTable = declareResource<TableData>('table:orders');

export const addColumn = defineTest({
  needs: [ordersTable],    // write by default
  ...
});
```

**Pros:** Minimal concept. **Cons:** Resources don't create themselves; data still flows through test outcomes. Resource mutations aren't tracked.

#### 5b. Resources as Factories with Lifecycle

Resources know how to create and destroy themselves. Framework manages lifecycle.

```typescript
const table = defineResource<TableData, { name: string }>({
  code: 'table',
  create: async (params, context) => { ... },
  destroy: async (data) => { ... },
});
```

**Pros:** Clean noun/verb separation, framework manages lifecycle. **Cons:** Breaks fractal principle (resources aren't tests). Can't test resource creation via UI. Resource mutations still not tracked.

#### 5c. Resources as Mutable State Containers

Resources are live objects that track current state. Tests update them explicitly.

```typescript
context.update(table({ name: 'orders' }), { ...t, columns: [...t.columns, newCol] });
```

**Pros:** State always current. **Cons:** Error-prone — test author must keep resource state in sync with actual DB/UI state. Manual state management.

#### 5d. Resources as Identity + Tests as Verbs (Hybrid)

Resources provide identity, tests declare which resource they operate `on`.

```typescript
export const testAddColumn = defineTest({
  on: table({ name: 'orders' }),   // "I mutate this resource"
  reads: [login('admin')],
  ...
});
```

**Pros:** Intuitive `on` keyword. **Cons:** New concept similar to `requires`. Tests that operate on multiple resources need more API.

**Cross-cutting issues for all resource approaches:**
- Resource mutations aren't trackable by the framework
- Isolation still requires physically different resources at every layer (DB, backend, frontend, browser)
- Resource dependencies (column depends on table) need their own graph
- Testing resource creation via UI conflicts with framework-managed creation

---

## Key Insights

### Isolation is physically expensive

"Isolating" a resource means creating a genuinely different object at every layer:
- Different DB record (different name, ID)
- Different backend API endpoints
- Different frontend URLs
- Different browser navigation

The framework cannot abstract this away. The fixture author must explicitly create unique resources based on params. There is no generic "clone" mechanism.

Database-level isolation (transactions, snapshots, separate DBs) doesn't work for e2e tests because the browser drives requests through the server's own connections.

### The complexity spiral

The discussion followed this trajectory:
1. How to handle shared mutable resources?
2. → Read/write access modes
3. → Auto-detection of access (infeasible)
4. → Write-by-default + DAG serialization
5. → Composition within flows
6. → Resources as first-class concept
7. → Four different resource approaches, each with issues

Each layer was introduced to solve problems created by the previous layer. This is a signal of over-engineering — designing solutions for hypothetical problems before encountering them in practice.

### What the framework adds over plain Playwright

Only two things are genuinely unique:

1. **Fixture/flow duality.** The same test has a programmatic path (fixture) and a UI path (flow). Downstream tests get state via the fast fixture. Playwright doesn't natively have this.
2. **Typed cross-file outcome sharing.** Playwright fixtures are scoped to a file or project. The outcome store lets any test access typed data from any other test.

Everything else (DAG validation, auto-generated runners, outcome codes) is infrastructure supporting these two features. Playwright's built-in system (`test.extend<T>()`, project dependencies, `storageState`, `test.describe.serial`) covers most other needs.

### The failure-mode argument (for future reference)

If write-by-default is ever implemented:
- Default=read → forget `.write()` → **flaky tests** (bad, hard to debug)
- Default=write → forget `.read()` → **slow tests** (acceptable, easy to optimize)

Safe-by-default is the stronger position.

---

## Recommendation (Original)

**Write 10-20 real tests using the current framework first.** Let actual pain points drive framework improvements.

The design options catalogued above are not wasted work — they're a menu of solutions ready to be applied when real needs arise. But implementing them prematurely risks building the wrong abstractions.

---

## Composable Test Architecture (Implemented)

The original fixture/flow model with `requires` dependencies was replaced with a composable scenario model. This section documents the design journey and key decisions.

### Design Journey

The original framework had:
- **Fixture/flow duality** — each test had a programmatic setup path and a browser test path
- **`requires` dependencies** — tests declared which other tests they needed, and the framework ran fixtures automatically
- **Outcome codes** — parameterized tests generated deterministic codes like `login("admin")`

This worked but had a fundamental limitation: **browser flows couldn't compose each other**. The `requires` system only ran fixtures (programmatic), never flows (browser). There was no way to write "log in, then create a database, then import a table" as a single composable user journey.

### Approaches Explored for Composition

#### Approach A: Proxy/Ref Tokens

Return proxy objects from `t.step()` that act as placeholders during dry-run and resolve to real values during execution.

```typescript
const db = await t.step('Create DB', createDatabase, { name: 'Library' });
// db.databaseName would be a Proxy that returns 'fake' during dry-run
```

**Rejected because:**
- Proxies are fragile with `toString()`, `valueOf()`, `Object.keys()`, `instanceof`
- Any non-property operation on a proxy can fail in unexpected ways
- Template literals, string concat, and utility functions break silently
- Debugging is painful — values look real but aren't

#### Approach B: Separate Structure Declaration

Declare the step structure separately from the scenario body, then have the scenario reference pre-declared steps.

```typescript
composes: [
  { label: 'Login', test: login, params: { user: 'admin' } },
  { label: 'Create DB', test: createDatabase, params: (results) => ({ name: 'Library' }) },
],
scenario: async (t, steps) => {
  const db = steps['Create DB'];
  // ...
}
```

**Rejected because:**
- Duplication between `composes` array and scenario body
- Data flow between steps requires awkward callback syntax
- Loses the natural sequential reading of the scenario

#### Approach C: Zod-Fake Dry-Run (Implemented)

Generate fake values from Zod schemas during dry-run. The scenario function runs in two modes (recorder vs executor) but the developer writes ONE function.

**Why this won:**
- **No proxies** — all values are real typed values. `"fake_string"` is a real string. `0` is a real number.
- **Computation works naturally** — `db.databaseName + "_backup"` produces `"fake_string_backup"` during dry-run and `"Library_backup"` during execution. Both are valid strings.
- **One function, two modes** — the developer is unaware of which mode is active
- **Static analysis** — the dry-run captures the complete step tree for DAG visualization and validation
- **Determinism enforcement** — comparing dry-run and execution trees catches conditional steps automatically

### What Changed

| Before | After |
|--------|-------|
| `fixture` + `flow` functions | Single `scenario` function |
| `requires: [install, login('admin')]` | `t.step('Login', login, { user: 'admin' })` |
| `TestContext.get(handle)` | `const result = await t.step(...)` |
| `RequirementHandle` with `.read()`/`.write()` | Direct `TestHandle` reference |
| Outcome codes: `login("admin")` | Test codes: `login` |
| `TestCallable` (callable with primary params) | `TestHandle` (referenced in `t.step()`) |
| Zod types not used | Zod schemas for params, outcomes, and action returns |

### Deferred Items

These features from the original framework are not yet reimplemented in the composable model:

1. **Fixtures** — The fast programmatic setup path (no browser). Will re-add when needed for performance optimization of deep composition chains.
2. **Location validation** — Each test declaring start/end page locations, validated as a chain. Add after core DX is working.
3. **Standalone mode refinements** — Setup steps, compose-only tests, etc.
4. **Read/write access modes** — For parallelization of independent tests. Revisit when parallel execution becomes a priority.
5. **Cross-worker outcome sharing** — The file-backed outcome store. May need rethinking with the composable model.

### State Machine Model

Explicitly rejected as a first-class concept. State machines may look good on paper but are terrible for frontend and e2e testing in practice. The composable scenario model borrows useful ideas (typed state transitions via return values) without imposing a state machine framework.

---

## Quick Reference: Design Options Menu

| Problem | Solution | Complexity | Status |
|---------|----------|------------|--------|
| Browser flows can't compose each other | Composable scenarios with `t.step()` | Medium | **Implemented** |
| Static analysis of test structure | Dry-run with Zod-generated fake values | Medium | **Implemented** |
| Conditional steps cause flaky DAGs | Step tree comparison (dry-run vs execution) | Low | **Implemented** |
| Two tests accidentally run in parallel | Read/write access modes | Low | Deferred |
| Fast programmatic setup path | Fixtures as alternative to browser flows | Medium | Deferred |
| Test start/end page validation | Location chain validation | Low | Deferred |
