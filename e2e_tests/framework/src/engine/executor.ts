import type { Page } from '@playwright/test';
import type { z } from 'zod';
import type { ScenarioContext, StepNode, TestHandle } from '../types';

export interface ExecutionResult<TOutcome> {
  outcome: TOutcome;
  stepTree: StepNode[];
}

/**
 * Execute a test's scenario with a real browser page.
 *
 * The executor `t` object:
 * - t.step() → recursively executes the sub-scenario, returns real outcome
 * - t.action() → runs the closure with the page, validates return, returns real result
 * - t.check() → runs the closure with the page
 *
 * Records the step tree during execution for comparison with the dry-run tree.
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

  const executor: ScenarioContext = {
    async step<P, O>(
      label: string,
      subTest: TestHandle<P, O>,
      subParams: P,
    ): Promise<O> {
      try {
        const subResult = await execute(page, subTest, subParams);
        nodes.push({
          type: 'step',
          label,
          testCode: subTest.code,
          children: subResult.stepTree,
        });
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

  return { outcome, stepTree: nodes };
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
