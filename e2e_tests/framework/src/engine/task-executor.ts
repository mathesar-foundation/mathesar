import type {
  TaskStepNode,
  TaskHandle,
  TestFixtures,
} from '../types';
import type { SubStepRecord } from '../store/outcome-store';
import { createExecutorContext, setTaskExecuteFn } from './create-task-context';

export interface TaskExecutionResult<TOutcome> {
  outcome: TOutcome;
  stepTree: TaskStepNode[];
  subSteps: SubStepRecord[];
}

/**
 * Execute a task's scenario with a real browser page.
 *
 * The executor `t` object:
 * - t.ensure() → checks resource/task cache; on miss, runs task (programmatic preferred)
 * - t.perform() → checks task cache; on miss, runs task (manual/browser)
 * - t.action() → runs the closure, validates return, records resource ops
 * - t.check() → runs the closure
 */
export async function taskExecute<TParams, TOutcome>(
  fixtures: TestFixtures,
  handle: TaskHandle<TParams, TOutcome>,
  params: TParams,
): Promise<TaskExecutionResult<TOutcome>> {
  // Validate params against schema
  const paramsResult = handle.paramsSchema.safeParse(params);
  if (!paramsResult.success) {
    throw new Error(
      `Invalid params for task '${handle.code}': ${paramsResult.error.message}`,
    );
  }

  const nodes: TaskStepNode[] = [];
  const subStepRecords: SubStepRecord[] = [];

  const executor = createExecutorContext(
    fixtures,
    handle.code,
    nodes,
    subStepRecords,
  );

  const outcome = await handle.taskFn(executor, params);

  // Validate outcome against schema
  const outcomeResult = handle.outcomeSchema.safeParse(outcome);
  if (!outcomeResult.success) {
    throw new Error(
      `Task '${handle.code}' returned invalid outcome: ` +
        outcomeResult.error.message,
    );
  }

  return { outcome, stepTree: nodes, subSteps: subStepRecords };
}

// Register taskExecute as the recursive executor for the shared context factory
setTaskExecuteFn(taskExecute);
