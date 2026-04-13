import type { z } from 'zod';
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

export interface TaskExecutionResult<TOutcome> {
  outcome: TOutcome;
  stepTree: TaskStepNode[];
  subSteps: SubStepRecord[];
}

/**
 * Record resource operations from an action into the resource store.
 * Handles parent operations and cascading child operations.
 */
function recordResourceOps(
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
      // Cascade: delete child resources
      // The cascade uses the parent key relationship from child resource definitions.
      // Since we don't have a global resource type registry, cascade is handled by
      // the deleteByPrefix approach for known child types.
      // Full cascade will be implemented with the DAG validator.
      break;
  }

  // Process child resource operations (from .with() chaining)
  for (const childOp of op.children) {
    recordResourceOps(childOp, outcome, taskCode);
  }
}

/**
 * Check the resource lifecycle cache for all resources a task would create.
 * Returns the cached outcome if ALL created resources exist.
 */
function checkResourceCache(
  handle: TaskHandle,
  params: unknown,
): unknown | undefined {
  // To check resource cache, we need to know what resources the task creates.
  // This requires inspecting the task's action resource declarations.
  // During execution, we don't have this info statically — it's captured during
  // dry-run via the step tree.
  //
  // For now, t.ensure() falls back to the task completion cache (same as t.perform()
  // but with programmatic path preference). Full resource-level caching will be
  // wired up when DAG-time resource tracing is implemented.
  return undefined;
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

  const executor: TaskContext = {
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
          // Note: restoreFromCache expects a TestHandle-compatible object
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
          const subResult = await taskExecute(fixtures, subTask, subParams);
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
        const subResult = await taskExecute(fixtures, subTask, subParams);
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
          `Action '${label}' in task '${handle.code}' failed`,
        );
      }

      // Validate against schema
      const parseResult = config.schema.safeParse(result);
      if (!parseResult.success) {
        throw new Error(
          `Action '${label}' in task '${handle.code}' returned invalid data: ` +
            parseResult.error.message,
        );
      }

      // Record resource operations
      if (config.resource) {
        recordResourceOps(
          config.resource,
          result as Record<string, unknown>,
          handle.code,
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
          `Check '${label}' in task '${handle.code}' failed`,
        );
      }
      nodes.push({ type: 'check', label });
    },
  };

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

function wrapError(err: unknown, context: string): Error {
  if (err instanceof Error) {
    if (!err.message.startsWith(context)) {
      err.message = `${context}: ${err.message}`;
    }
    return err;
  }
  return new Error(`${context}: ${String(err)}`);
}
