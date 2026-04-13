import type { TaskStepNode } from '../types';
import { registry, isTaskHandle } from '../store/registry';
import { taskDryRun } from './task-dry-run';
import type { TaskHandle } from '../types';

export interface TaskDagNode {
  taskCode: string;
  hasStandalone: boolean;
  stepTree: TaskStepNode[];
  /** Task codes referenced via t.ensure() or t.perform() — direct children only */
  composedTasks: string[];
}

export interface TaskDagValidationError {
  type: 'cycle' | 'missing_task';
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
    if (!isTaskHandle(handle)) continue;

    try {
      const result = await taskDryRun(handle as TaskHandle, standaloneParams);
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
