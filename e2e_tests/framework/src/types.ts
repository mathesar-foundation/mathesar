import type { Page } from '@playwright/test';

export type ParamValue = string | number | boolean;
export type ParamRecord = Record<string, ParamValue>;
/** @deprecated Use ParamRecord instead */
export type ParamDefaults = ParamRecord;
export type AccessMode = 'read' | 'write';

export interface RequirementHandle<TOutcome = unknown> {
  readonly outcomeCode: string;
  readonly testCode: string;
  readonly resolvedParams: ParamRecord;
  readonly access: AccessMode;
  read(): RequirementHandle<TOutcome>;
  write(): RequirementHandle<TOutcome>;
}

export interface TestContext {
  get<T>(handle: RequirementHandle<T>): T;
}

export interface RegisteredTest {
  testCode: string;
  outcomeCode: string;
  resolvedParams: ParamRecord;
  isStandalone: boolean;
  getRequirements(): RequirementHandle[];
  runFixture(context: TestContext): Promise<unknown>;
  runFlow(page: Page, context: TestContext): Promise<void>;
}

export interface TestDefNoParams<TOutcome> {
  code: string;
  requires?: RequirementHandle[];
  fixture: (context: TestContext) => Promise<TOutcome>;
  flow: (page: Page, context: TestContext) => Promise<void>;
}

export interface TestDefWithParams<TOutcome, TParams extends ParamRecord = ParamRecord> {
  code: string;
  params: TParams;
  primaryParams: readonly (keyof TParams & string)[];
  requires?:
    | RequirementHandle[]
    | ((params: TParams) => RequirementHandle[]);
  fixture: (context: TestContext, params: TParams) => Promise<TOutcome>;
  flow: (
    page: Page,
    context: TestContext,
    params: TParams,
  ) => Promise<void>;
}

export interface TestCallable<TOutcome = unknown> {
  (...args: unknown[]): RequirementHandle<TOutcome>;
  readonly testCode: string;
  readonly standaloneOutcomeCode: string;
  readonly defaultParams: ParamRecord;
}
