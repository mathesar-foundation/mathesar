import type { TestFixtures } from '../types';
import { outcomeStore } from '../store/outcome-store';
import { registry } from '../store/registry';

/**
 * Recursively restore browser state from cached outcomes.
 *
 * Walks the sub-step tree in depth-first order (dependencies before dependents),
 * matching DAG topological order. Uses a Set to avoid duplicate restores for
 * diamond dependencies.
 *
 * Generic over TOutcome so callers can pass a fully-typed TaskHandle<P, O>
 * without casting. The recursive call through the registry infers TOutcome
 * as `unknown` (since registry erases type params), which is safe because
 * outcomes were schema-validated when stored.
 *
 * @param fixtures - Playwright test fixtures (page, baseURL, request)
 * @param cacheKey - Cache key of the test whose state to restore
 * @param handle - Object with an optional restoreFn
 * @param restored - Set of already-restored cache keys (for diamond dep dedup)
 */
export async function restoreFromCache<TOutcome = unknown>(
  fixtures: TestFixtures,
  cacheKey: string,
  handle: { restoreFn?: (fixtures: TestFixtures, outcome: TOutcome) => Promise<void> },
  restored?: Set<string>,
): Promise<void> {
  const seen = restored ?? new Set<string>();
  if (seen.has(cacheKey)) return;
  seen.add(cacheKey);

  const entry = outcomeStore.get(cacheKey);
  if (!entry) return;

  // Depth-first: restore transitive dependencies BEFORE this test.
  // Sub-steps are stored in execution order (the order t.step() was called),
  // so this naturally follows the DAG dependency order.
  for (const sub of entry.subSteps) {
    const subRegistered = registry.get(sub.testCode);
    if (subRegistered?.handle) {
      await restoreFromCache(fixtures, sub.cacheKey, subRegistered.handle, seen);
    }
  }

  // Then restore this test's own browser state.
  // The cast is safe: entry.outcome was validated against outcomeSchema when stored.
  if (handle.restoreFn) {
    await handle.restoreFn(fixtures, entry.outcome as TOutcome);
  }
}
