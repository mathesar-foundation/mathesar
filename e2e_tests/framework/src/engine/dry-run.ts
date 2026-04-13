import type { ScenarioContext, StepNode, TestHandle, TestFixtures } from '../types';
import { generateFakeValue } from './zod-fake';

export interface DryRunResult {
  stepTree: StepNode[];
}

/**
 * Dry-run a test's scenario to capture its step tree without running any
 * browser code.
 *
 * The recorder `t` object:
 * - t.step() → recursively dry-runs the sub-scenario, returns Zod fake outcome
 * - t.action() → skips the closure, returns Zod fake from schema
 * - t.check() → skips the closure
 *
 * All returned values are real typed values (not proxies), so computation
 * in the scenario body works naturally.
 *
 * Cycle detection: tracks which test codes are currently being dry-run
 * in the current call stack to detect circular references.
 */
export async function dryRun<TParams, TOutcome>(
  handle: TestHandle<TParams, TOutcome>,
  params?: TParams,
  _visiting?: Set<string>,
): Promise<DryRunResult> {
  const visiting = _visiting ?? new Set<string>();

  if (visiting.has(handle.code)) {
    throw new Error(
      `Circular dependency detected during dry-run: test '${handle.code}' ` +
        `is already being dry-run in the current call chain.`,
    );
  }

  visiting.add(handle.code);

  const actualParams = params ?? generateFakeValue(handle.paramsSchema);
  const nodes: StepNode[] = [];

  const recorder: ScenarioContext = {
    async step<P, O>(
      label: string,
      subTest: TestHandle<P, O>,
      subParams: P,
    ): Promise<O> {
      const subResult = await dryRun(subTest, subParams, visiting);
      nodes.push({
        type: 'step',
        label,
        testCode: subTest.code,
        children: subResult.stepTree,
      });
      return generateFakeValue(subTest.outcomeSchema);
    },

    async action<O>(
      label: string,
      schema: import('zod').ZodType<O>,
      _fn: (fixtures: TestFixtures) => Promise<O>,
    ): Promise<O> {
      nodes.push({ type: 'action', label });
      return generateFakeValue(schema);
    },

    async check(
      label: string,
      _fn: (fixtures: TestFixtures) => Promise<void>,
    ): Promise<void> {
      nodes.push({ type: 'check', label });
    },
  };

  await handle.scenarioFn(recorder, actualParams);

  visiting.delete(handle.code);

  return { stepTree: nodes };
}
