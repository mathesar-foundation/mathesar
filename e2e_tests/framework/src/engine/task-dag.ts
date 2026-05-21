import type { TaskStepNode } from '../types';
import { registry } from '../store/registry';
import { taskDryRun } from './task-dry-run';
import { scenarioDryRun } from './scenario-dry-run';
import { validateResourceLifecycles } from './task-dag-validate-resources';

export interface TaskDagNode {
  taskCode: string;
  hasStandalone: boolean;
  stepTree: TaskStepNode[];
  /** Task codes referenced via t.ensure() or t.perform() — direct children only */
  composedTasks: string[];
  /** True if this node is a scenario (leaf node). */
  isScenario?: boolean;
}

export interface TaskDagValidationError {
  type:
    | 'cycle'
    | 'missing_task'
    | 'resource_update_without_create'
    | 'resource_duplicate_perform_create'
    | 'resource_create_after_delete'
    | 'resource_missing_parent';
  message: string;
}

export interface TaskDag {
  nodes: Map<string, TaskDagNode>;
  errors: TaskDagValidationError[];
  topologicalOrder: string[];
}

/**
 * Build the DAG by dry-running all registered tasks and analyzing their step trees.
 */
export async function buildTaskDag(): Promise<TaskDag> {
  const entries = registry.getAll();
  const nodes = new Map<string, TaskDagNode>();
  const errors: TaskDagValidationError[] = [];

  for (const entry of entries) {
    const { handle, standaloneParams } = entry;

    try {
      const result = await taskDryRun(handle, standaloneParams);
      const composedTasks = extractComposedTasks(result.stepTree);

      nodes.set(handle.code, {
        taskCode: handle.code,
        hasStandalone: standaloneParams !== undefined,
        stepTree: result.stepTree,
        composedTasks,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const isCycle = message.includes('Circular dependency');
      errors.push({
        type: isCycle ? 'cycle' : 'missing_task',
        message: isCycle
          ? message
          : `Failed to dry-run task '${handle.code}': ${message}`,
      });
    }
  }

  // Process scenarios as leaf nodes
  const scenarioEntries = registry.getAllScenarios();
  for (const entry of scenarioEntries) {
    const { handle } = entry;

    try {
      const result = await scenarioDryRun(handle);
      const composedTasks = extractComposedTasks(result.stepTree);

      nodes.set(handle.code, {
        taskCode: handle.code,
        hasStandalone: true, // scenarios are always standalone
        stepTree: result.stepTree,
        composedTasks,
        isScenario: true,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      errors.push({
        type: 'missing_task',
        message: `Failed to dry-run scenario '${handle.code}': ${message}`,
      });
    }
  }

  // Check for missing task references
  for (const [, node] of nodes) {
    for (const composedCode of node.composedTasks) {
      if (!nodes.has(composedCode) && !registry.has(composedCode)) {
        errors.push({
          type: 'missing_task',
          message:
            `Task '${node.taskCode}' references task '${composedCode}' via t.ensure()/t.perform(), ` +
            `but '${composedCode}' is not registered.`,
        });
      }
    }
  }

  // Topological sort
  const topologicalOrder: string[] = [];
  const visited = new Set<string>();
  const visiting = new Set<string>();

  function visit(code: string): boolean {
    if (visited.has(code)) return true;
    if (visiting.has(code)) return false;

    visiting.add(code);
    const node = nodes.get(code);
    if (node) {
      for (const dep of node.composedTasks) {
        if (!visit(dep)) {
          errors.push({
            type: 'cycle',
            message: `Circular dependency detected involving '${code}' and '${dep}'`,
          });
          return false;
        }
      }
    }
    visiting.delete(code);
    visited.add(code);
    topologicalOrder.push(code);
    return true;
  }

  for (const code of nodes.keys()) {
    visit(code);
  }

  // Validate resource lifecycles across all tasks
  const levels = computeTaskLevels({ nodes, errors: [], topologicalOrder });
  const resourceErrors = validateResourceLifecycles(nodes, topologicalOrder, levels);
  errors.push(...resourceErrors);

  return { nodes, errors, topologicalOrder };
}

/**
 * Compute execution levels for tasks.
 */
export function computeTaskLevels(dag: TaskDag): Map<string, number> {
  const levels = new Map<string, number>();
  for (const code of dag.topologicalOrder) {
    const node = dag.nodes.get(code);
    if (!node || node.composedTasks.length === 0) {
      levels.set(code, 0);
    } else {
      const maxDepLevel = Math.max(
        ...node.composedTasks.map((dep) => levels.get(dep) ?? 0),
      );
      levels.set(code, maxDepLevel + 1);
    }
  }
  return levels;
}

/**
 * Extract task codes from ensure/perform nodes in a step tree.
 */
function extractComposedTasks(tree: TaskStepNode[]): string[] {
  const codes = new Set<string>();

  for (const node of tree) {
    if (node.type === 'ensure' || node.type === 'perform') {
      codes.add(node.taskCode);
    }
  }

  return Array.from(codes);
}
