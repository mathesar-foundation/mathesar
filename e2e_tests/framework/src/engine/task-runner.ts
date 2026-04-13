import type { TaskHandle, TestFixtures } from '../types';
import { registry } from '../store/registry';
import { outcomeStore } from '../store/outcome-store';
import { isTaskHandle } from '../store/registry';
import { taskDryRun } from './task-dry-run';
import { taskExecute } from './task-executor';
import { compareTaskStepTrees } from './task-step-tree-compare';
import { makeCacheKey } from './cache-key';

/**
 * Run a standalone task with a real browser page.
 *
 * 1. Checks if the outcome is already cached (skip if so)
 * 2. Looks up the task in the registry
 * 3. Dry-runs the task to get the expected step tree
 * 4. Executes the task with the real browser
 * 5. Compares step trees (detects conditional steps)
 * 6. Stores the outcome for cross-worker sharing
 */
export async function runTaskFlow(
  fixtures: TestFixtures,
  ref: TaskHandle | string,
): Promise<void> {
  const code = typeof ref === 'string' ? ref : ref.code;
  const entry = registry.get(code);

  if (!entry) {
    throw new Error(
      `Task with code '${code}' not found in registry. ` +
        `Ensure the task definition file is imported.`,
    );
  }

  if (!isTaskHandle(entry.handle)) {
    throw new Error(
      `'${code}' is not a TaskHandle. Use runFlow() for legacy TestHandle.`,
    );
  }

  const handle = entry.handle as TaskHandle;
  const { standaloneParams } = entry;

  if (standaloneParams === undefined) {
    throw new Error(
      `Task '${code}' has no standalone params. ` +
        `Only tasks with standalone config can be run directly.`,
    );
  }

  // Check if outcome is already cached
  const cacheKey = makeCacheKey(code, standaloneParams);
  if (outcomeStore.has(cacheKey)) {
    console.log(`Skipping '${code}' \u2014 outcome already cached`);
    return;
  }

  // 1. Dry-run to capture expected step tree
  const dryRunResult = await taskDryRun(handle, standaloneParams);

  // 2. Execute with real browser
  const executionResult = await taskExecute(fixtures, handle, standaloneParams);

  // 3. Compare step trees
  const mismatch = compareTaskStepTrees(
    code,
    dryRunResult.stepTree,
    executionResult.stepTree,
  );
  if (mismatch) {
    throw new Error(mismatch.message);
  }

  // 4. Store outcome for cross-worker sharing
  outcomeStore.set(cacheKey, executionResult.outcome, executionResult.subSteps);
}
