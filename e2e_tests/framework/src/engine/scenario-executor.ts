import type {
  TaskStepNode,
  ScenarioHandle,
  TestFixtures,
} from '../types';
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
 */
export async function scenarioExecute(
  fixtures: TestFixtures,
  handle: ScenarioHandle,
): Promise<ScenarioExecutionResult> {
  const nodes: TaskStepNode[] = [];
  const subStepRecords: { testCode: string; cacheKey: string }[] = [];

  const executor = createExecutorContext(
    fixtures,
    handle.code,
    nodes,
    subStepRecords,
  );

  await handle.scenarioFn(executor);

  return { stepTree: nodes };
}
