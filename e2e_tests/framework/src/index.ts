// Engine — orchestration and execution
export { defineTest } from './engine/define-test';
export { runFlow } from './engine/test-runner';
export { dryRun } from './engine/dry-run';
export { execute } from './engine/executor';
export { buildDag, computeLevels } from './engine/dag';
export { generateFakeValue } from './engine/zod-fake';
export { compareStepTrees } from './engine/step-tree-compare';
export { makeCacheKey } from './engine/cache-key';
export { restoreFromCache } from './engine/restore';
export {
  normalizeBrowserState,
  browserStateChanged,
  snapshotBrowserState,
} from './engine/browser-state';

// Store — data and state management
export { registry } from './store/registry';
export { outcomeStore } from './store/outcome-store';

// Config
export { createPlaywrightConfig, getResolvedConfig, toRelativePosix } from './config';
export type { ScreenwriterConfig, ResolvedScreenwriterConfig } from './config';

// Types
export type {
  TestFixtures,
  TestHandle,
  TestDefinition,
  ScenarioContext,
  ScenarioFn,
  StepNode,
} from './types';
export type { DagNode, Dag, DagValidationError } from './engine/dag';
export type { DryRunResult } from './engine/dry-run';
export type { ExecutionResult } from './engine/executor';
export type { SubStepRecord, StoredEntry } from './store/outcome-store';
export type { RegisteredEntry } from './store/registry';
export type { RunnerGeneratorConfig } from '../scripts/generate-runners';
export type { NormalizedBrowserState } from './engine/browser-state';
