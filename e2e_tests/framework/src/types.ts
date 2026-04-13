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

// ---------------------------------------------------------------------------
// Resources
// ---------------------------------------------------------------------------

/** CRUD operation types for resource declarations on actions. */
export type ResourceOpType = 'create' | 'update' | 'delete';

/**
 * A resource operation declaration attached to a t.action() call.
 * Created via ResourceHandle helper methods: .creates(), .updates(), .deletes().
 * Supports .with() chaining for child resource operations.
 */
export interface ResourceOp {
  readonly resourceHandle: ResourceHandle<any>;
  readonly op: ResourceOpType;
  /** Key in the action's return value where the resource state lives. */
  readonly field: string;
  /** Child resource operations (via .with() chaining). */
  readonly children: ResourceOp[];
  /**
   * Declare a child resource operation that happens as part of this operation.
   * Only valid for resource types in the parent-child nesting hierarchy.
   */
  with(childOp: ResourceOp): ResourceOp;
}

/**
 * Parent-child relationship declared on a child resource.
 * The key function derives the parent's instance key from the child's state.
 */
export interface ResourceParent<TState> {
  readonly type: ResourceHandle<any>;
  readonly key: (state: TState) => string;
}

/**
 * A resource handle returned by defineResource(). Represents a resource type
 * with a schema, key function, and optional parent nesting.
 *
 * Used directly in task params/outcomes via .schema, and to declare
 * resource operations on actions via .creates(), .updates(), .deletes().
 */
export interface ResourceHandle<TState> {
  readonly type: string;
  readonly schema: z.ZodType<TState>;
  readonly key: (state: TState) => string;
  readonly parent?: ResourceParent<TState>;

  /** Declare that an action creates an instance of this resource. */
  creates(field: string): ResourceOp;
  /** Declare that an action updates an instance of this resource. */
  updates(field: string): ResourceOp;
  /** Declare that an action deletes an instance of this resource. */
  deletes(field: string): ResourceOp;
}

/**
 * Input to defineResource().
 */
export interface ResourceDefinition<TState> {
  type: string;
  schema: z.ZodType<TState>;
  key: (state: TState) => string;
  parent?: {
    type: ResourceHandle<any>;
    key: (state: TState) => string;
  };
}

// ---------------------------------------------------------------------------
// Legacy types (defineTest) — kept during migration, will be removed
// ---------------------------------------------------------------------------

/**
 * A test handle returned by defineTest(). Used as a reference in t.step().
 * @deprecated Use TaskHandle instead.
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
 * @deprecated Use TaskFn instead.
 */
export type ScenarioFn<TParams, TOutcome> = (
  t: ScenarioContext,
  params: TParams,
) => Promise<TOutcome>;

/**
 * Input to defineTest().
 * @deprecated Use TaskDefinition instead.
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
 * @deprecated Use TaskContext instead.
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
 * @deprecated Use StepNode (new version below) instead.
 */
export type LegacyStepNode =
  | { type: 'step'; label: string; testCode: string; children: LegacyStepNode[] }
  | { type: 'action'; label: string }
  | { type: 'check'; label: string };

/** @deprecated Alias for LegacyStepNode during migration. */
export type StepNode = LegacyStepNode;

// ---------------------------------------------------------------------------
// Tasks
// ---------------------------------------------------------------------------

/**
 * Configuration for a t.action() call.
 */
export interface ActionConfig<O> {
  schema: z.ZodType<O>;
  /** Optional resource operation for this action. One primary op per action. */
  resource?: ResourceOp;
  fn: (fixtures: TestFixtures) => Promise<O>;
}

/**
 * The task function signature (manual/browser path).
 */
export type TaskFn<TParams, TOutcome> = (
  t: TaskContext,
  params: TParams,
) => Promise<TOutcome>;

/**
 * A task handle returned by defineTask(). Used as a reference in
 * t.ensure() and t.perform() calls.
 */
export interface TaskHandle<TParams = unknown, TOutcome = unknown> {
  readonly code: string;
  readonly paramsSchema: z.ZodType<TParams>;
  readonly outcomeSchema: z.ZodType<TOutcome>;
  readonly taskFn: TaskFn<TParams, TOutcome>;
  readonly programmaticFn?: (params: TParams) => Promise<TOutcome>;
  readonly restoreFn?: (fixtures: TestFixtures, outcome: TOutcome) => Promise<void>;
}

/**
 * Input to defineTask().
 */
export interface TaskDefinition<TParams, TOutcome> {
  code: string;
  params: z.ZodType<TParams>;
  outcome: z.ZodType<TOutcome>;
  /** Manual path — browser-based implementation. */
  task: TaskFn<TParams, TOutcome>;
  /** Programmatic path — fast, non-browser implementation. Used by t.ensure(). */
  programmatic?: (params: TParams) => Promise<TOutcome>;
  /** Restore hook — reconstructs browser state from cached outcome. */
  restore?: (fixtures: TestFixtures, outcome: TOutcome) => Promise<void>;
  /** Standalone config — enables running this task as a top-level test. */
  standalone?: { params: TParams };
}

/**
 * The `t` object passed to task functions.
 * Has two implementations: recorder (dry-run) and executor (real browser).
 */
export interface TaskContext {
  /**
   * Compose a task for its resource output. Checks the resource lifecycle
   * cache first — skips the task if the resource already exists.
   * Prefers the programmatic path when available.
   */
  ensure<P, O>(task: TaskHandle<P, O>, params: P): Promise<O>;

  /**
   * Compose a task to exercise it. Checks the task completion cache —
   * skips if this exact task+params has already been executed.
   * Always uses the manual (browser) path.
   */
  perform<P, O>(task: TaskHandle<P, O>, params: P): Promise<O>;

  /**
   * Run a browser action that produces typed data.
   * Optionally declares a resource operation.
   */
  action<O>(label: string, config: ActionConfig<O>): Promise<O>;

  /**
   * Run a browser assertion.
   */
  check(label: string, fn: (fixtures: TestFixtures) => Promise<void>): Promise<void>;
}

// ---------------------------------------------------------------------------
// Scenarios
// ---------------------------------------------------------------------------

/**
 * A scenario handle returned by defineScenario(). Scenarios are leaf nodes
 * in the DAG — they compose tasks but are never composed themselves.
 */
export interface ScenarioHandle {
  readonly code: string;
  readonly description: string;
  readonly scenarioFn: (t: TaskContext) => Promise<void>;
}

/**
 * Input to defineScenario().
 */
export interface ScenarioDefinition {
  code: string;
  description: string;
  scenario: (t: TaskContext) => Promise<void>;
}

// ---------------------------------------------------------------------------
// Step tree (new version for tasks/scenarios)
// ---------------------------------------------------------------------------

/** Intent of a task composition: resource-centric or task-centric. */
export type CompositionIntent = 'ensure' | 'perform';

/**
 * Captured step tree node from dry-run or execution (new model).
 */
export type TaskStepNode =
  | {
      type: 'ensure' | 'perform';
      label: string;
      taskCode: string;
      children: TaskStepNode[];
    }
  | { type: 'action'; label: string; resource?: ResourceOp }
  | { type: 'check'; label: string };
