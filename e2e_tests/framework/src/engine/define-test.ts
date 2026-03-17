import type {
  ParamValue,
  ParamRecord,
  RequirementHandle,
  TestDefNoParams,
  TestDefWithParams,
  TestCallable,
} from '../types';
import { generateOutcomeCode } from '../store/outcome-code';
import { registry } from '../store/registry';

function createHandle<T>(
  testCode: string,
  outcomeCode: string,
  resolvedParams: ParamRecord,
  access: 'read' | 'write' = 'read',
): RequirementHandle<T> {
  return {
    outcomeCode,
    testCode,
    resolvedParams,
    access,
    read() {
      return createHandle<T>(testCode, outcomeCode, resolvedParams, 'read');
    },
    write() {
      return createHandle<T>(testCode, outcomeCode, resolvedParams, 'write');
    },
  };
}

// --- Overloads ---

export function defineTest<TOutcome>(
  def: TestDefNoParams<TOutcome> & { params?: never },
): RequirementHandle<TOutcome>;
export function defineTest<TOutcome, TParams extends ParamRecord>(
  def: TestDefWithParams<TOutcome, TParams>,
): TestCallable<TOutcome>;
export function defineTest<TOutcome, TParams extends ParamRecord>(
  def: TestDefNoParams<TOutcome> | TestDefWithParams<TOutcome, TParams>,
): RequirementHandle<TOutcome> | TestCallable<TOutcome> {
  if ('params' in def && def.params) {
    return defineWithParams(def as TestDefWithParams<TOutcome, TParams>);
  }
  return defineNoParams(def as TestDefNoParams<TOutcome>);
}

// --- No params ---

function defineNoParams<TOutcome>(
  def: TestDefNoParams<TOutcome>,
): RequirementHandle<TOutcome> {
  const outcomeCode = def.code;
  const requirements = def.requires || [];

  registry.register({
    testCode: def.code,
    outcomeCode,
    resolvedParams: {},
    isStandalone: true,
    getRequirements: () => requirements,
    runFixture: (ctx) => def.fixture(ctx),
    runFlow: (page, ctx) => def.flow(page, ctx),
  });

  return createHandle<TOutcome>(def.code, outcomeCode, {});
}

// --- With params ---

function defineWithParams<TOutcome, TParams extends ParamRecord>(
  def: TestDefWithParams<TOutcome, TParams>,
): TestCallable<TOutcome> {
  const defaults: TParams = { ...def.params };
  const primaryKeys = [...def.primaryParams];

  const standaloneOutcomeCode = generateOutcomeCode(def.code, defaults);

  registry.register({
    testCode: def.code,
    outcomeCode: standaloneOutcomeCode,
    resolvedParams: defaults,
    isStandalone: true,
    getRequirements: () =>
      typeof def.requires === 'function'
        ? def.requires(defaults)
        : (def.requires || []),
    runFixture: (ctx) => def.fixture(ctx, defaults),
    runFlow: (page, ctx) => def.flow(page, ctx, defaults),
  });

  const cache = new Map<string, RequirementHandle<TOutcome>>();

  const callable = ((...args: unknown[]): RequirementHandle<TOutcome> => {
    // Safe cast: resolveArgs spreads defaults (TParams) and only modifies values at existing keys
    const resolved = resolveArgs(args, defaults, primaryKeys) as TParams;
    const outcomeCode = generateOutcomeCode(def.code, resolved);

    const cached = cache.get(outcomeCode);
    if (cached) return cached;

    registry.register({
      testCode: def.code,
      outcomeCode,
      resolvedParams: resolved,
      isStandalone: false,
      getRequirements: () =>
        typeof def.requires === 'function'
          ? def.requires(resolved)
          : (def.requires || []),
      runFixture: (ctx) => def.fixture(ctx, resolved),
      runFlow: (page, ctx) => def.flow(page, ctx, resolved),
    });

    const handle = createHandle<TOutcome>(def.code, outcomeCode, resolved);
    cache.set(outcomeCode, handle);
    return handle;
  }) as TestCallable<TOutcome>;

  Object.defineProperties(callable, {
    testCode: { value: def.code, writable: false },
    standaloneOutcomeCode: { value: standaloneOutcomeCode, writable: false },
    defaultParams: { value: defaults, writable: false },
  });

  return callable;
}

// --- Arg resolution ---

function resolveArgs(
  args: unknown[],
  defaults: ParamRecord,
  primaryKeys: string[],
): ParamRecord {
  const resolved = { ...defaults };

  if (primaryKeys.length === 1) {
    if (args.length === 0) {
      throw new Error(
        `Primary param '${primaryKeys[0]}' is required when used as a dependency`,
      );
    }
    resolved[primaryKeys[0]] = args[0] as ParamValue;
    if (args.length > 1 && typeof args[1] === 'object' && args[1] !== null) {
      Object.assign(resolved, args[1]);
    }
  } else {
    if (args.length === 0 || typeof args[0] !== 'object' || args[0] === null) {
      throw new Error(
        `Primary params (${primaryKeys.join(', ')}) are required when used as a dependency`,
      );
    }
    const primaries = args[0] as Record<string, ParamValue>;
    for (const key of primaryKeys) {
      if (!(key in primaries)) {
        throw new Error(`Primary param '${key}' is required`);
      }
      resolved[key] = primaries[key];
    }
    if (args.length > 1 && typeof args[1] === 'object' && args[1] !== null) {
      Object.assign(resolved, args[1]);
    }
  }

  return resolved;
}
