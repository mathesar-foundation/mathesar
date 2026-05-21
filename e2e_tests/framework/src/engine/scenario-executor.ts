import type {
  TaskStepNode,
  ScenarioHandle,
  TestFixtures,
} from '../types';
import type { BrowserStateChange } from './browser-state';
import { createExecutorContext } from './create-task-context';
// Ensure taskExecute is loaded so setTaskExecuteFn is called
import './task-executor';

export interface ScenarioExecutionResult {
  stepTree: TaskStepNode[];
}

/**
 * Execute a scenario with a real browser page.
 *
 * Similar to taskExecute but:
 * - No params (scenarios have none)
 * - No outcome validation (scenarios return void)
 * - No outcome caching (scenarios are fire-and-forget)
 * - No "missing restore hook" warning: scenarios are never composed by
 *   anything, so their browser state never needs restoration. The
 *   ownChanges array is still threaded to keep the executor context API
 *   uniform, but its contents are discarded.
 */
export async function scenarioExecute(
  fixtures: TestFixtures,
  handle: ScenarioHandle,
): Promise<ScenarioExecutionResult> {
  const nodes: TaskStepNode[] = [];
  const subStepRecords: { testCode: string; cacheKey: string }[] = [];
  const ownChanges: BrowserStateChange[] = [];

  const executor = createExecutorContext(
    fixtures,
    handle.code,
    nodes,
    subStepRecords,
    ownChanges,
  );

  await handle.scenarioFn(executor);

  return { stepTree: nodes };
}
