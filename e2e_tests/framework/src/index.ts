// Engine — orchestration and execution
export { defineTest } from './engine/define-test';
export { defineResource } from './engine/define-resource';
export { defineTask } from './engine/define-task';
export { defineScenario } from './engine/define-scenario';
export { runFlow } from './engine/test-runner';
export { runTaskFlow } from './engine/task-runner';
export { dryRun } from './engine/dry-run';
export { taskDryRun } from './engine/task-dry-run';
export { execute } from './engine/executor';
export { taskExecute } from './engine/task-executor';
export { compareTaskStepTrees } from './engine/task-step-tree-compare';
export { buildDag, computeLevels } from './engine/dag';
export { buildTaskDag, computeTaskLevels } from './engine/task-dag';
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
export { resourceStore } from './store/resource-store';

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
export type { DagNode, Dag, DagValidationError } from './engine/dag';
export type { DryRunResult } from './engine/dry-run';
export type { TaskDryRunResult } from './engine/task-dry-run';
export type { ExecutionResult } from './engine/executor';
export type { TaskExecutionResult } from './engine/task-executor';
export type { ResourceInstance } from './store/resource-store';
export type { SubStepRecord, StoredEntry } from './store/outcome-store';
export type { RegisteredEntry, RegisteredHandle } from './store/registry';
export { isTaskHandle, isTestHandle } from './store/registry';
export type { RunnerGeneratorConfig } from '../scripts/generate-runners';
export type { NormalizedBrowserState } from './engine/browser-state';
