import type { Page } from '@playwright/test';
import type { TestHandle } from '../types';
import { registry } from '../store/registry';
import { outcomeStore } from '../store/outcome-store';
import { dryRun } from './dry-run';
import { execute } from './executor';
import { compareStepTrees } from './step-tree-compare';

/**
 * Run a standalone test's scenario with a real browser page.
 *
 * 1. Looks up the test in the registry
 * 2. Dry-runs the scenario to get the expected step tree
 * 3. Executes the scenario with the real browser
 * 4. Compares step trees (detects conditional steps)
 * 5. Stores the outcome for cross-worker sharing
 *
 * @param page - Playwright Page object
 * @param ref - Test code string or TestHandle
 */
export async function runFlow(
  page: Page,
  ref: TestHandle | string,
): Promise<void> {
  const code = typeof ref === 'string' ? ref : ref.code;
  const entry = registry.get(code);

  if (!entry) {
    throw new Error(
      `Test with code '${code}' not found in registry. ` +
        `Ensure the test definition file is imported.`,
    );
  }

  const { handle, standaloneParams } = entry;

  if (standaloneParams === undefined) {
    throw new Error(
      `Test '${code}' has no standalone params. ` +
        `Only tests with standalone config can be run directly.`,
    );
  }

  // 1. Dry-run to capture expected step tree
  const dryRunResult = await dryRun(handle, standaloneParams);

  // 2. Execute with real browser
  const executionResult = await execute(page, handle, standaloneParams);

  // 3. Compare step trees
  const mismatch = compareStepTrees(
    code,
    dryRunResult.stepTree,
    executionResult.stepTree,
  );
  if (mismatch) {
    throw new Error(mismatch.message);
  }

  // 4. Store outcome for cross-worker sharing
  outcomeStore.set(code, executionResult.outcome);
}
