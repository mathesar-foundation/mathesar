import type {
  TaskContext,
  TaskStepNode,
  TaskHandle,
  TestFixtures,
  ActionConfig,
  ResourceOp,
} from '../types';
import type { SubStepRecord } from '../store/outcome-store';
import { outcomeStore } from '../store/outcome-store';
import { resourceStore } from '../store/resource-store';
import { makeCacheKey } from './cache-key';
import { restoreFromCache } from './restore';
import { taskDryRun } from './task-dry-run';
import {
  snapshotBrowserState,
  browserStateChanged,
} from './browser-state';

/**
 * Record resource operations from an action into the resource store.
 * Handles parent operations and cascading child operations.
 */
export function recordResourceOps(
  op: ResourceOp,
  outcome: Record<string, unknown>,
  taskCode: string,
): void {
  const resourceHandle = op.resourceHandle;
  const state = outcome[op.field];

  if (state === undefined) {
    throw new Error(
      `Action declared resource ${op.op} on field '${op.field}', ` +
        `but the action's return value has no '${op.field}' property.`,
    );
  }

  const instanceKey = resourceHandle.key(state as any);

  switch (op.op) {
    case 'create':
      resourceStore.set(resourceHandle.type, instanceKey, state, taskCode);
      break;
    case 'update':
      resourceStore.set(resourceHandle.type, instanceKey, state, taskCode);
      break;
    case 'delete':
      resourceStore.delete(resourceHandle.type, instanceKey);
      break;
  }

  // Process child resource operations (from .with() chaining)
  for (const childOp of op.children) {
    recordResourceOps(childOp, outcome, taskCode);
  }
}

/**
 * Forward declaration — taskExecute calls createExecutorContext which calls
 * taskExecute recursively. This avoids a circular import by using a late-bound
 * function reference.
 */
export type TaskExecuteFn = <TParams, TOutcome>(
  fixtures: TestFixtures,
  handle: TaskHandle<TParams, TOutcome>,
  params: TParams,
) => Promise<{ outcome: TOutcome; stepTree: TaskStepNode[]; subSteps: SubStepRecord[] }>;

let _taskExecute: TaskExecuteFn | undefined;

export function setTaskExecuteFn(fn: TaskExecuteFn): void {
  _taskExecute = fn;
}

function getTaskExecute(): TaskExecuteFn {
  if (!_taskExecute) {
    throw new Error('taskExecute not initialized. Call setTaskExecuteFn first.');
  }
  return _taskExecute;
}

function wrapError(err: unknown, context: string): Error {
  if (err instanceof Error) {
    if (!err.message.startsWith(context)) {
      err.message = `${context}: ${err.message}`;
    }
    return err;
  }
  return new Error(`${context}: ${String(err)}`);
}

/**
 * Create a TaskContext executor implementation for use in both task and
 * scenario execution. The context handles ensure/perform/action/check
 * with caching, resource tracking, and browser state management.
 */
export function createExecutorContext(
  fixtures: TestFixtures,
  contextLabel: string,
  nodes: TaskStepNode[],
  subStepRecords: SubStepRecord[],
): TaskContext {
  return {
    async ensure<P, O>(
      subTask: TaskHandle<P, O>,
      subParams: P,
    ): Promise<O> {
      const cacheKey = makeCacheKey(subTask.code, subParams);

      // Check task completion cache
      const cached = outcomeStore.get(cacheKey);
      if (cached) {
        const parseResult = subTask.outcomeSchema.safeParse(cached.outcome);
        if (parseResult.success) {
          // Restore browser state from cache
          await restoreFromCache(fixtures, cacheKey, subTask as any);

          const dryRunResult = await taskDryRun(subTask, subParams);
          nodes.push({
            type: 'ensure',
            label: subTask.code,
            taskCode: subTask.code,
            children: dryRunResult.stepTree,
          });
          subStepRecords.push({ testCode: subTask.code, cacheKey });

          return parseResult.data;
        }
      }

      // Cache miss: execute using programmatic path if available, else manual
      try {
        let subOutcome: O;
        let subStepTree: TaskStepNode[];
        let subSubSteps: SubStepRecord[];

        if (subTask.programmaticFn) {
          // Programmatic path — no browser, fast
          subOutcome = await subTask.programmaticFn(subParams);

          // Validate outcome
          const outcomeResult = subTask.outcomeSchema.safeParse(subOutcome);
          if (!outcomeResult.success) {
            throw new Error(
              `Task '${subTask.code}' programmatic path returned invalid outcome: ` +
                outcomeResult.error.message,
            );
          }

          // Dry-run for step tree shape
          const dryRunResult = await taskDryRun(subTask, subParams);
          subStepTree = dryRunResult.stepTree;
          subSubSteps = [];
        } else {
          // Manual path — browser-based
          const before = await snapshotBrowserState(fixtures.page);
          const subResult = await getTaskExecute()(fixtures, subTask, subParams);
          const after = await snapshotBrowserState(fixtures.page);

          if (browserStateChanged(before, after) && !subTask.restoreFn) {
            console.warn(
              `\u26a0 Task '${subTask.code}' modifies browser state but has no restore hook.`,
            );
          }

          subOutcome = subResult.outcome;
          subStepTree = subResult.stepTree;
          subSubSteps = subResult.subSteps;
        }

        outcomeStore.set(cacheKey, subOutcome, subSubSteps);

        nodes.push({
          type: 'ensure',
          label: subTask.code,
          taskCode: subTask.code,
          children: subStepTree,
        });
        subStepRecords.push({ testCode: subTask.code, cacheKey });

        return subOutcome;
      } catch (err) {
        throw wrapError(err, `ensure '${subTask.code}' failed`);
      }
    },

    async perform<P, O>(
      subTask: TaskHandle<P, O>,
      subParams: P,
    ): Promise<O> {
      const cacheKey = makeCacheKey(subTask.code, subParams);

      // Check task completion cache
      const cached = outcomeStore.get(cacheKey);
      if (cached) {
        const parseResult = subTask.outcomeSchema.safeParse(cached.outcome);
        if (parseResult.success) {
          await restoreFromCache(fixtures, cacheKey, subTask as any);

          const dryRunResult = await taskDryRun(subTask, subParams);
          nodes.push({
            type: 'perform',
            label: subTask.code,
            taskCode: subTask.code,
            children: dryRunResult.stepTree,
          });
          subStepRecords.push({ testCode: subTask.code, cacheKey });

          return parseResult.data;
        }
      }

      // Cache miss: always use manual (browser) path for perform
      try {
        const before = await snapshotBrowserState(fixtures.page);
        const subResult = await getTaskExecute()(fixtures, subTask, subParams);
        const after = await snapshotBrowserState(fixtures.page);

        if (browserStateChanged(before, after) && !subTask.restoreFn) {
          console.warn(
            `\u26a0 Task '${subTask.code}' modifies browser state but has no restore hook.`,
          );
        }

        outcomeStore.set(cacheKey, subResult.outcome, subResult.subSteps);

        nodes.push({
          type: 'perform',
          label: subTask.code,
          taskCode: subTask.code,
          children: subResult.stepTree,
        });
        subStepRecords.push({ testCode: subTask.code, cacheKey });

        return subResult.outcome;
      } catch (err) {
        throw wrapError(err, `perform '${subTask.code}' failed`);
      }
    },

    async action<O>(
      label: string,
      config: ActionConfig<O>,
    ): Promise<O> {
      let result: O;
      try {
        result = await config.fn(fixtures);
      } catch (err) {
        throw wrapError(
          err,
          `Action '${label}' in '${contextLabel}' failed`,
        );
      }

      // Validate against schema
      const parseResult = config.schema.safeParse(result);
      if (!parseResult.success) {
        throw new Error(
          `Action '${label}' in '${contextLabel}' returned invalid data: ` +
            parseResult.error.message,
        );
      }

      // Record resource operations
      if (config.resource) {
        recordResourceOps(
          config.resource,
          result as Record<string, unknown>,
          contextLabel,
        );
      }

      nodes.push({
        type: 'action',
        label,
        resource: config.resource,
      });
      return result;
    },

    async check(
      label: string,
      fn: (fixtures: TestFixtures) => Promise<void>,
    ): Promise<void> {
      try {
        await fn(fixtures);
      } catch (err) {
        throw wrapError(
          err,
          `Check '${label}' in '${contextLabel}' failed`,
        );
      }
      nodes.push({ type: 'check', label });
    },
  };
}
