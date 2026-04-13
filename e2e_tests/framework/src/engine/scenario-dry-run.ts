import type {
  TaskContext,
  TaskStepNode,
  TaskHandle,
  TestFixtures,
  ActionConfig,
  ScenarioHandle,
} from '../types';
import { generateFakeValue } from './zod-fake';
import { taskDryRun } from './task-dry-run';

export interface ScenarioDryRunResult {
  stepTree: TaskStepNode[];
}

/**
 * Dry-run a scenario to capture its step tree without running any
 * browser code or programmatic functions.
 *
 * Similar to taskDryRun but:
 * - No params (scenarios have none)
 * - No outcome (scenarios return void)
 * - No cycle detection at scenario level (scenarios are leaves — never composed)
 *
 * The recorder's ensure/perform delegate to taskDryRun for sub-tasks.
 */
export async function scenarioDryRun(
  handle: ScenarioHandle,
): Promise<ScenarioDryRunResult> {
  const nodes: TaskStepNode[] = [];

  const recorder: TaskContext = {
    async ensure<P, O>(
      subTask: TaskHandle<P, O>,
      subParams: P,
    ): Promise<O> {
      const subResult = await taskDryRun(subTask, subParams);
      nodes.push({
        type: 'ensure',
        label: subTask.code,
        taskCode: subTask.code,
        children: subResult.stepTree,
      });
      return generateFakeValue(subTask.outcomeSchema);
    },

    async perform<P, O>(
      subTask: TaskHandle<P, O>,
      subParams: P,
    ): Promise<O> {
      const subResult = await taskDryRun(subTask, subParams);
      nodes.push({
        type: 'perform',
        label: subTask.code,
        taskCode: subTask.code,
        children: subResult.stepTree,
      });
      return generateFakeValue(subTask.outcomeSchema);
    },

    async action<O>(
      label: string,
      config: ActionConfig<O>,
    ): Promise<O> {
      nodes.push({
        type: 'action',
        label,
        resource: config.resource,
      });
      return generateFakeValue(config.schema);
    },

    async check(
      label: string,
      _fn: (fixtures: TestFixtures) => Promise<void>,
    ): Promise<void> {
      nodes.push({ type: 'check', label });
    },
  };

  await handle.scenarioFn(recorder);

  return { stepTree: nodes };
}
