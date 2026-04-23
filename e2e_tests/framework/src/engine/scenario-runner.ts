import type { ScenarioHandle, TestFixtures } from '../types';
import { registry } from '../store/registry';
import { scenarioDryRun } from './scenario-dry-run';
import { scenarioExecute } from './scenario-executor';
import { compareTaskStepTrees } from './task-step-tree-compare';

/**
 * Run a scenario with a real browser page.
 *
 * 1. Looks up the scenario in the registry
 * 2. Dry-runs the scenario to get the expected step tree
 * 3. Executes the scenario with the real browser
 * 4. Compares step trees (detects conditional steps)
 *
 * Unlike runTaskFlow, scenarios:
 * - Have no standalone params (they ARE standalone)
 * - Have no outcome caching (they return void)
 */
export async function runScenarioFlow(
  fixtures: TestFixtures,
  ref: ScenarioHandle | string,
): Promise<void> {
  const code = typeof ref === 'string' ? ref : ref.code;
  const entry = registry.getScenario(code);

  if (!entry) {
    throw new Error(
      `Scenario with code '${code}' not found in registry. ` +
        `Ensure the scenario definition file is imported.`,
    );
  }

  const handle = entry.handle;

  // 1. Dry-run to capture expected step tree
  const dryRunResult = await scenarioDryRun(handle);

  // 2. Execute with real browser
  const executionResult = await scenarioExecute(fixtures, handle);

  // 3. Compare step trees
  const mismatch = compareTaskStepTrees(
    code,
    dryRunResult.stepTree,
    executionResult.stepTree,
  );
  if (mismatch) {
    throw new Error(mismatch.message);
  }
}
