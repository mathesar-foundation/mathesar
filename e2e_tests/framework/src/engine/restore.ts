import type { Page } from '@playwright/test';
import { outcomeStore } from '../store/outcome-store';
import { registry } from '../store/registry';

interface Restorable {
  restoreFn?: (page: Page, outcome: unknown) => Promise<void>;
}

/**
 * Recursively restore browser state from cached outcomes.
 *
 * Walks the sub-step tree in depth-first order (dependencies before dependents),
 * matching DAG topological order. Uses a Set to avoid duplicate restores for
 * diamond dependencies.
 *
 * @param page - Playwright Page to restore state on
 * @param cacheKey - Cache key of the test whose state to restore
 * @param handle - Object with an optional restoreFn
 * @param restored - Set of already-restored cache keys (for diamond dep dedup)
 */
export async function restoreFromCache(
  page: Page,
  cacheKey: string,
  handle: Restorable,
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
      await restoreFromCache(page, sub.cacheKey, subRegistered.handle, seen);
    }
  }

  // Then restore this test's own browser state
  if (handle.restoreFn) {
    await handle.restoreFn(page, entry.outcome);
  }
}
