import type {
  TaskContext,
  TaskStepNode,
  TaskHandle,
  TestFixtures,
  ActionConfig,
} from '../types';
import { generateFakeValue } from './zod-fake';

export interface TaskDryRunResult {
  stepTree: TaskStepNode[];
}

/**
 * Dry-run a task's scenario to capture its step tree without running any
 * browser code or programmatic functions.
 *
 * The recorder `t` object:
 * - t.ensure() → recursively dry-runs the sub-task, returns Zod fake outcome
 * - t.perform() → recursively dry-runs the sub-task, returns Zod fake outcome
 * - t.action() → skips the closure, returns Zod fake from schema, records resource op
 * - t.check() → skips the closure
 *
 * Both ensure and perform behave identically during dry-run — they both
 * capture the step tree. The distinction only matters at execution time.
 */
export async function taskDryRun<TParams, TOutcome>(
  handle: TaskHandle<TParams, TOutcome>,
  params?: TParams,
  _visiting?: Set<string>,
): Promise<TaskDryRunResult> {
  const visiting = _visiting ?? new Set<string>();

  if (visiting.has(handle.code)) {
    throw new Error(
      `Circular dependency detected during dry-run: task '${handle.code}' ` +
        `is already being dry-run in the current call chain.`,
    );
  }

  visiting.add(handle.code);

  const actualParams = params ?? generateFakeValue(handle.paramsSchema);
  const nodes: TaskStepNode[] = [];

  const recorder: TaskContext = {
    async ensure<P, O>(
      subTask: TaskHandle<P, O>,
      subParams: P,
    ): Promise<O> {
      const subResult = await taskDryRun(subTask, subParams, visiting);
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
      const subResult = await taskDryRun(subTask, subParams, visiting);
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

  await handle.taskFn(recorder, actualParams);

  visiting.delete(handle.code);

  return { stepTree: nodes };
}
