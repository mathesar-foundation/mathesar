import type { Page, APIRequestContext } from '@playwright/test';
import type { z } from 'zod';

/**
 * Playwright fixtures threaded through the framework.
 * Passed to action closures, check closures, and restore hooks.
 */
export interface TestFixtures {
  page: Page;
  baseURL: string;
  request: APIRequestContext;
}

/**
 * A test handle returned by defineTest(). Used as a reference in t.step().
 */
export interface TestHandle<TParams = unknown, TOutcome = unknown> {
  readonly code: string;
  readonly paramsSchema: z.ZodType<TParams>;
  readonly outcomeSchema: z.ZodType<TOutcome>;
  readonly scenarioFn: ScenarioFn<TParams, TOutcome>;
  readonly restoreFn?: (fixtures: TestFixtures, outcome: TOutcome) => Promise<void>;
}

/**
 * The scenario function signature. When TParams is {}, the params argument
 * can be omitted by the developer (TypeScript allows fewer params).
 */
export type ScenarioFn<TParams, TOutcome> = (
  t: ScenarioContext,
  params: TParams,
) => Promise<TOutcome>;

/**
 * Input to defineTest().
 */
export interface TestDefinition<TParams, TOutcome> {
  code: string;
  params: z.ZodType<TParams>;
  outcome: z.ZodType<TOutcome>;
  scenario: ScenarioFn<TParams, TOutcome>;
  standalone?: { params: TParams };
  restore?: (fixtures: TestFixtures, outcome: TOutcome) => Promise<void>;
}

/**
 * The `t` object passed to scenario functions.
 * Has two implementations: recorder (dry-run) and executor (real browser).
 */
export interface ScenarioContext {
  step<P, O>(label: string, test: TestHandle<P, O>, params: P): Promise<O>;
  action<O>(
    label: string,
    schema: z.ZodType<O>,
    fn: (fixtures: TestFixtures) => Promise<O>,
  ): Promise<O>;
  check(label: string, fn: (fixtures: TestFixtures) => Promise<void>): Promise<void>;
}

/**
 * Captured step tree node from dry-run or execution.
 */
export type StepNode =
  | { type: 'step'; label: string; testCode: string; children: StepNode[] }
  | { type: 'action'; label: string }
  | { type: 'check'; label: string };
