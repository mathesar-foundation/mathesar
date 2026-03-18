import type { Page } from '@playwright/test';
import type { z } from 'zod';
import type { ScenarioContext, StepNode, TestHandle } from '../types';
import type { SubStepRecord } from '../store/outcome-store';
import { outcomeStore } from '../store/outcome-store';
import { makeCacheKey } from './cache-key';
import { restoreFromCache } from './restore';
import { dryRun } from './dry-run';
import {
  snapshotBrowserState,
  browserStateChanged,
} from './browser-state';

export interface ExecutionResult<TOutcome> {
  outcome: TOutcome;
  stepTree: StepNode[];
  subSteps: SubStepRecord[];
}

/**
 * Execute a test's scenario with a real browser page.
 *
 * The executor `t` object:
 * - t.step() → checks cache first; on miss, recursively executes the sub-scenario
 * - t.action() → runs the closure with the page, validates return, returns real result
 * - t.check() → runs the closure with the page
 *
 * Records the step tree during execution for comparison with the dry-run tree.
 * Records sub-step metadata for recursive restore on future cache hits.
 */
export async function execute<TParams, TOutcome>(
  page: Page,
  handle: TestHandle<TParams, TOutcome>,
  params: TParams,
): Promise<ExecutionResult<TOutcome>> {
  // Validate params against schema before running
  const paramsResult = handle.paramsSchema.safeParse(params);
  if (!paramsResult.success) {
    throw new Error(
      `Invalid params for test '${handle.code}': ${paramsResult.error.message}`,
    );
  }

  const nodes: StepNode[] = [];
  const subStepRecords: SubStepRecord[] = [];

  const executor: ScenarioContext = {
    async step<P, O>(
      label: string,
      subTest: TestHandle<P, O>,
      subParams: P,
    ): Promise<O> {
      const cacheKey = makeCacheKey(subTest.code, subParams);

      // CACHE HIT: use stored outcome, restore browser state, dry-run for tree shape
      const cached = outcomeStore.get(cacheKey);
      if (cached) {
        // Schema-validate the cached outcome
        const parseResult = subTest.outcomeSchema.safeParse(cached.outcome);
        if (parseResult.success) {
          // Recursively restore browser state from all transitive dependencies
          await restoreFromCache(page, cacheKey, subTest);

          // Dry-run for step tree shape (must match what the parent's dry-run produced)
          const dryRunResult = await dryRun(subTest, subParams);

          nodes.push({
            type: 'step',
            label,
            testCode: subTest.code,
            children: dryRunResult.stepTree,
          });
          subStepRecords.push({ testCode: subTest.code, cacheKey });

          return parseResult.data;
        }
        // If schema validation fails, fall through to re-execute
      }

      // CACHE MISS: execute with real browser, detect browser state changes
      try {
        const before = await snapshotBrowserState(page);
        const subResult = await execute(page, subTest, subParams);
        const after = await snapshotBrowserState(page);

        // Warn if browser state changed but no restore hook exists
        if (browserStateChanged(before, after) && !subTest.restoreFn) {
          console.warn(
            `\u26a0 Test '${subTest.code}' modifies browser state (cookies/localStorage changed) ` +
              `but has no restore hook.\n` +
              `  When composed via t.step() and cached, browser state will NOT be reconstructed.\n` +
              `  Add a restore function to defineTest() for '${subTest.code}' to handle this.`,
          );
        }

        // Store outcome + sub-step records for future cache hits
        outcomeStore.set(cacheKey, subResult.outcome, subResult.subSteps);

        nodes.push({
          type: 'step',
          label,
          testCode: subTest.code,
          children: subResult.stepTree,
        });
        subStepRecords.push({ testCode: subTest.code, cacheKey });

        return subResult.outcome;
      } catch (err) {
        throw wrapError(
          err,
          `Step '${label}' (test '${subTest.code}') failed`,
        );
      }
    },

    async action<O>(
      label: string,
      schema: z.ZodType<O>,
      fn: (page: Page) => Promise<O>,
    ): Promise<O> {
      let result: O;
      try {
        result = await fn(page);
      } catch (err) {
        throw wrapError(err, `Action '${label}' in test '${handle.code}' failed`);
      }

      const parseResult = schema.safeParse(result);
      if (!parseResult.success) {
        throw new Error(
          `Action '${label}' in test '${handle.code}' returned invalid data: ` +
            parseResult.error.message,
        );
      }

      nodes.push({ type: 'action', label });
      return result;
    },

    async check(
      label: string,
      fn: (page: Page) => Promise<void>,
    ): Promise<void> {
      try {
        await fn(page);
      } catch (err) {
        throw wrapError(err, `Check '${label}' in test '${handle.code}' failed`);
      }
      nodes.push({ type: 'check', label });
    },
  };

  const outcome = await handle.scenarioFn(executor, params);

  // Validate outcome against schema
  const outcomeResult = handle.outcomeSchema.safeParse(outcome);
  if (!outcomeResult.success) {
    throw new Error(
      `Test '${handle.code}' returned invalid outcome: ` +
        outcomeResult.error.message,
    );
  }

  return { outcome, stepTree: nodes, subSteps: subStepRecords };
}

function wrapError(err: unknown, context: string): Error {
  if (err instanceof Error) {
    // Don't double-wrap
    if (!err.message.startsWith(context)) {
      err.message = `${context}: ${err.message}`;
    }
    return err;
  }
  return new Error(`${context}: ${String(err)}`);
}
