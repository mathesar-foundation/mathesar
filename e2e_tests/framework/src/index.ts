// Engine — orchestration and execution
export { defineResource } from './engine/define-resource';
export { defineTask } from './engine/define-task';
export { defineScenario } from './engine/define-scenario';
export { runTaskFlow } from './engine/task-runner';
export { runScenarioFlow } from './engine/scenario-runner';
export { taskDryRun } from './engine/task-dry-run';
export { scenarioDryRun } from './engine/scenario-dry-run';
export { taskExecute } from './engine/task-executor';
export { scenarioExecute } from './engine/scenario-executor';
export { compareTaskStepTrees } from './engine/task-step-tree-compare';
export { buildTaskDag, computeTaskLevels } from './engine/task-dag';
export { validateResourceLifecycles } from './engine/task-dag-validate-resources';
export { generateFakeValue } from './engine/zod-fake';
export { makeCacheKey } from './engine/cache-key';
export { restoreFromCache } from './engine/restore';
export {
  normalizeBrowserState,
  browserStateChanged,
  describeBrowserStateChanges,
  formatMissingRestoreHookWarning,
  snapshotBrowserState,
} from './engine/browser-state';

// Store — data and state management
export { registry } from './store/registry';
export { outcomeStore } from './store/outcome-store';
export { resourceStore } from './store/resource-store';

// Config
export { createPlaywrightConfig, getResolvedConfig, toRelativePosix } from './config';
export type { ScreenwriterConfig, ResolvedScreenwriterConfig } from './config';

// Types
export type {
  TestFixtures,
  ResourceHandle,
  ResourceOp,
  ResourceOpType,
  ResourceDefinition,
  ResourceParent,
  TaskHandle,
  TaskDefinition,
  TaskFn,
  TaskContext,
  ActionConfig,
  ScenarioHandle,
  ScenarioDefinition,
  TaskStepNode,
  CompositionIntent,
} from './types';
export type { TaskDagNode, TaskDag, TaskDagValidationError } from './engine/task-dag';
export type { TaskDryRunResult } from './engine/task-dry-run';
export type { ScenarioDryRunResult } from './engine/scenario-dry-run';
export type { TaskExecutionResult } from './engine/task-executor';
export type { ScenarioExecutionResult } from './engine/scenario-executor';
export type { ResourceInstance } from './store/resource-store';
export type { SubStepRecord, StoredEntry } from './store/outcome-store';
export type { RegisteredEntry, RegisteredScenario } from './store/registry';
export { isScenarioHandle } from './store/registry';
export type { RunnerGeneratorConfig } from '../scripts/generate-runners';
export type { NormalizedBrowserState, BrowserStateChange } from './engine/browser-state';
