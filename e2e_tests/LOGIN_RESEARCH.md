# Login & Browser State Restoration Research

Research notes from architectural discussions about how the framework should handle authentication and browser state restoration across test phases and parallel workers.

## Playwright's Auth Mechanisms

Playwright's core mechanism is **`storageState`** — it captures the entire browser context state (all cookies, localStorage, IndexedDB) as an opaque JSON blob and restores it wholesale. No cherry-picking individual values.

### Pattern 1: Setup Project + storageState File

A dedicated `auth.setup.ts` runs before all tests, authenticates via UI, and saves the full state:

```typescript
setup('authenticate', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Username').fill('user');
  await page.getByLabel('Password').fill('pass');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL('/');
  await page.context().storageState({ path: 'playwright/.auth/user.json' });
});
```

Test projects depend on the setup and load the file:

```typescript
projects: [
  { name: 'setup', testMatch: /.*\.setup\.ts/ },
  {
    name: 'chromium',
    use: { storageState: 'playwright/.auth/user.json' },
    dependencies: ['setup'],
  },
]
```

Every test starts with a pre-authenticated context.

### Pattern 2: API-Based Auth

Same result, but faster — no browser interaction:

```typescript
setup('authenticate', async ({ request }) => {
  await request.post('/login', { form: { user: 'user', password: 'pass' } });
  await request.storageState({ path: authFile });
});
```

### Pattern 3: Worker-Scoped Fixtures

For parallel workers needing unique auth (different user accounts per worker):

```typescript
const test = baseTest.extend({
  workerStorageState: [async ({ browser }, use) => {
    const id = test.info().parallelIndex;
    const fileName = `.auth/${id}.json`;
    if (fs.existsSync(fileName)) { await use(fileName); return; }
    const page = await browser.newPage({ storageState: undefined });
    // authenticate as user[id]...
    await page.context().storageState({ path: fileName });
    await use(fileName);
  }, { scope: 'worker' }],
});
```

### Key Takeaways

1. **Opaque blob, not individual values** — Playwright never asks "which cookies matter?" It saves everything and restores everything.
2. **State saved to files** — JSON files persist between setup and test phases.
3. **Context-level restore** — `storageState` is applied at context creation time, before any navigation.
4. **CSRF is a non-issue** — all cookies (including csrftoken) are captured in the blob.
5. **No re-authentication on restore** — just loads the JSON file.

---

## How Our Framework Maps to Playwright

| Playwright concept | Our framework equivalent |
|---|---|
| `storageState` JSON file | Outcome store (cached outcomes) |
| Setup project | Phase-0/Phase-1 (DAG levels) |
| `storageState` option on context creation | Restore hook |
| Project dependencies | DAG-based execution levels |

The critical difference: Playwright applies `storageState` at **context creation time** (clean context + full state). Our restore hooks run on an **existing context**, using `addCookies` (additive API). This asymmetry drives most of the failure scenarios below.

---

## Auto-Capture/Auto-Restore Approach

### Concept

Instead of requiring users to write restore hooks that manually set cookies, the framework could:

1. **Auto-capture**: After a test executes, capture `page.context().storageState()` and store it alongside the outcome. Only capture when `browserStateChanged()` returns `true` (most tests don't modify browser state).
2. **Auto-restore**: On cache hit, apply the stored state via `addCookies` + `addInitScript` (for localStorage). Transitive, depth-first, same as current restore order.
3. **Restore hooks as escape hatch**: Keep `restore` as an optional override for edge cases.

### Why This is Appealing

- User just writes the login scenario. Framework handles capture/restore automatically.
- No need to know which cookies matter.
- No manual cookie extraction or schema wiring.
- Only a handful of tests (login, maybe theme preferences) would trigger capture — no "state explosion."

---

## Failure Scenarios and Pitfalls

### 1. `addCookies` is Additive — Can't Express Removals

`addCookies` only adds or overwrites cookies. It never removes them. A snapshot captures what EXISTS but can't express what was REMOVED.

**Example — logout test:**
```
login → logout
```
- `login` sets `{sessionid, csrftoken}` → snapshot captured
- `logout` removes `sessionid` → snapshot: `{csrftoken}` only

On restore (depth-first): apply login's snapshot → `{sessionid, csrftoken}`. Apply logout's snapshot → `addCookies([csrftoken])` — no-op for sessionid. **sessionid persists when it shouldn't.**

**Mitigation**: Call `clearCookies()` before the restore walk, then apply only the leaf-most snapshot (since it's a full capture including all ancestor effects). But this breaks if the leaf ran in a different context than some ancestors (diamond dependencies).

### 2. Diamond Dependencies with Independent Contexts

```
        login
       /     \
    testA    testB    (Phase 2, parallel workers)
       \     /
        testC         (Phase 3)
```

testA and testB ran in separate workers with separate contexts. Each has its own snapshot. When restoring testC:
- testA's snapshot: `{sessionid=S1, csrftoken=C1, cookieX=1}`
- testB's snapshot: `{sessionid=S1, csrftoken=C1, cookieY=2}`

After applying both (addCookies is additive): `{sessionid=S1, csrftoken=C1, cookieX=1, cookieY=2}`. This happens to match testC's original execution (testA and testB ran sequentially within testC).

**Risk**: Works by accident because `addCookies` is additive. If testB had REMOVED cookieX (set by testA), the removal would be lost. Also fragile if execution order during restore differs from original.

### 3. Non-Deterministic / Incidental Cookies

Third-party scripts may set analytics cookies (`_ga=<timestamp>`), or the server may set `last_visited=<datetime>`. These are captured in the snapshot but are incidental — not meaningful for test restoration.

**Issues:**
- Stale timestamps applied on restore
- `browserStateChanged()` flags these tests unnecessarily, triggering auto-capture
- Adds noise to stored state

The framework can't distinguish "auth cookies that must be restored" from "incidental cookies that don't matter."

### 4. localStorage Timing Gap

Cookies applied via `addCookies` are immediate — available before any navigation. localStorage can only be restored via `addInitScript()`, which runs on the **next page load**. If a test reads localStorage before navigating (via `page.evaluate()`), it sees empty storage.

Unlikely in practice (tests navigate first per convention), but a semantic gap.

### 5. Server-Side Session Validity

The snapshot contains a `sessionid` that was valid when captured. If the server-side session is gone (restart, expiry), the cookie is restored but the session is dead. The framework has no way to detect this.

Within a single Docker-based test run, sessions are stable (outcome store is cleared between runs). For long-running suites or shared environments, this is a real risk.

### 6. `page.request` vs Standalone `request` Fixture

Cookies applied via `page.context().addCookies()` are shared with `page.request` (the page's API context). But Playwright's standalone `request` fixture has a **separate** cookie jar. Tests using `request` (not `page.request`) won't see restored auth cookies.

### 7. Parallel Workers Sharing Server-Side Sessions

When login runs once (Phase 1) and caches, ALL Phase 2 workers restore the same session. They share one server-side session.

**Risks:**
- **Session-based CSRF** (`CSRF_USE_SESSIONS = True`): CSRF secret is in the session. Concurrent POST requests from two workers could corrupt session data.
- **Session locking**: Some frameworks lock the session during requests. Concurrent requests deadlock.
- **Stateful sessions**: Wizard state, cart contents, etc. in the session cause interference.

**Mitigation**: Per-worker auth via parameterized login — `t.step('Login', login, { user: users[workerIndex] })` produces different cache keys. But this is app-specific; the framework can't enforce it.

---

## The Fundamental Tension

The auto-capture approach tries to use **full snapshots** (what Playwright captures) but applies them via **incremental APIs** (`addCookies` — additive, no removals). Playwright avoids this tension because it applies `storageState` at **context creation** — the context starts clean with the full state. Our framework can't do that because the context already exists when restore runs.

Two ways to resolve:

1. **Make restore behave like context creation**: `clearCookies()` + clear localStorage before the walk, then apply only the leaf-most snapshot (full state). Risk: diamond dependencies where the leaf is missing state from parallel branches.

2. **Keep restore hooks for complex cases**: Auto-capture for the simple linear case (login → downstream). Restore hooks as escape hatch for logouts, diamond deps, incidental cookies.

---

## Current Decision: Programmatic Re-Login in Restore Hook

For now, the login test:
- Stores only `username` and `password` in the outcome
- The restore hook makes a fresh programmatic login (GET for CSRF token, POST with credentials)
- This establishes a new valid session every time, avoiding stale cookies entirely

This is simple, correct, and sidesteps all the snapshot-based pitfalls. It adds a network call to restore (~50-100ms) but guarantees a valid session.

The auto-capture/auto-restore approach remains a future option for the framework, with the pitfalls documented above as design constraints.
