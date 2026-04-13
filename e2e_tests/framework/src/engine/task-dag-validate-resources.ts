import type { TaskStepNode, ResourceOp } from '../types';
import type { TaskDagNode, TaskDagValidationError } from './task-dag';

/**
 * Collected resource operation from walking a step tree.
 */
interface CollectedResourceOp {
  resourceType: string;
  op: 'create' | 'update' | 'delete';
  /** Whether the containing ensure/perform node uses 'ensure' intent (idempotent). */
  viaEnsure: boolean;
  /** The task code where this operation is declared. */
  taskCode: string;
  /** Parent resource type, if this is a child resource. */
  parentType?: string;
}

/**
 * Flatten a ResourceOp (and its .with() children) into individual entries.
 */
function flattenResourceOp(
  op: ResourceOp,
  taskCode: string,
  viaEnsure: boolean,
): CollectedResourceOp[] {
  const result: CollectedResourceOp[] = [];

  result.push({
    resourceType: op.resourceHandle.type,
    op: op.op,
    viaEnsure,
    taskCode,
    parentType: op.resourceHandle.parent?.type.type,
  });

  for (const child of op.children) {
    result.push(...flattenResourceOp(child, taskCode, viaEnsure));
  }

  return result;
}

/**
 * Walk a step tree and collect all resource operations in execution order.
 *
 * For ensure/perform nodes, recursively walks the composed task's step tree
 * (looked up from the nodes map) and marks operations with the composition intent.
 */
function collectResourceOps(
  stepTree: TaskStepNode[],
  nodes: Map<string, TaskDagNode>,
  ownerTaskCode: string,
  viaEnsure: boolean,
): CollectedResourceOp[] {
  const ops: CollectedResourceOp[] = [];

  for (const node of stepTree) {
    if (node.type === 'ensure' || node.type === 'perform') {
      const isEnsure = node.type === 'ensure';
      // Walk the composed task's step tree from the children captured during dry-run
      ops.push(...collectResourceOps(node.children, nodes, node.taskCode, isEnsure));
    } else if (node.type === 'action' && node.resource) {
      ops.push(...flattenResourceOp(node.resource, ownerTaskCode, viaEnsure));
    }
    // 'check' nodes have no resource operations
  }

  return ops;
}

/**
 * Validate resource lifecycles within a single task's execution path.
 *
 * Walks the step tree in order, tracking which resource types are
 * "available" (created) and "deleted", then checks each operation
 * against the current state.
 */
function validateSingleTask(
  node: TaskDagNode,
  nodes: Map<string, TaskDagNode>,
): TaskDagValidationError[] {
  const errors: TaskDagValidationError[] = [];
  const ops = collectResourceOps(node.stepTree, nodes, node.taskCode, false);

  const available = new Set<string>();
  const deleted = new Set<string>();

  for (const op of ops) {
    switch (op.op) {
      case 'create': {
        if (deleted.has(op.resourceType)) {
          errors.push({
            type: 'resource_create_after_delete',
            message:
              `Task '${node.taskCode}': resource type '${op.resourceType}' is created ` +
              `after being deleted earlier in the execution path.`,
          });
        }

        // Check parent availability for child resources
        if (op.parentType && !available.has(op.parentType)) {
          // Check if parent is being created in the same action
          // (handled by .with() — parent and child in the same flattenResourceOp batch)
          // We need to check if the parent was already added in this iteration
          // This is naturally handled since flattenResourceOp processes parent first,
          // then children. But if the parent resource op is itself a child (not in this batch),
          // we check the available set.
          errors.push({
            type: 'resource_missing_parent',
            message:
              `Task '${node.taskCode}': child resource type '${op.resourceType}' is created ` +
              `but parent resource type '${op.parentType}' has not been created.`,
          });
        }

        available.add(op.resourceType);
        break;
      }

      case 'update': {
        if (!available.has(op.resourceType)) {
          errors.push({
            type: 'resource_update_without_create',
            message:
              `Task '${node.taskCode}': resource type '${op.resourceType}' is updated ` +
              `but has not been created by any prior action or composed task.`,
          });
        }
        break;
      }

      case 'delete': {
        if (!available.has(op.resourceType)) {
          errors.push({
            type: 'resource_update_without_create',
            message:
              `Task '${node.taskCode}': resource type '${op.resourceType}' is deleted ` +
              `but has not been created by any prior action or composed task.`,
          });
        }
        deleted.add(op.resourceType);
        available.delete(op.resourceType);
        break;
      }
    }
  }

  return errors;
}

/**
 * Validate resource lifecycles across all tasks in the DAG.
 *
 * Two levels of validation:
 * 1. Per-task: each task's step tree is walked to check that resource operations
 *    are structurally valid (create before update/delete, no create after delete, etc.)
 * 2. Cross-task: standalone tasks at the same execution level that both t.perform()
 *    a sub-task creating the same resource type are flagged as potential conflicts.
 */
export function validateResourceLifecycles(
  nodes: Map<string, TaskDagNode>,
  topologicalOrder: string[],
  levels?: Map<string, number>,
): TaskDagValidationError[] {
  const errors: TaskDagValidationError[] = [];

  // Per-task validation
  for (const code of topologicalOrder) {
    const node = nodes.get(code);
    if (!node) continue;
    errors.push(...validateSingleTask(node, nodes));
  }

  // Cross-task validation: detect duplicate perform-creates at the same level
  if (levels) {
    // Group standalone tasks by level
    const tasksByLevel = new Map<number, TaskDagNode[]>();
    for (const [, node] of nodes) {
      if (!node.hasStandalone) continue;
      const level = levels.get(node.taskCode);
      if (level === undefined) continue;
      const group = tasksByLevel.get(level) ?? [];
      group.push(node);
      tasksByLevel.set(level, group);
    }

    // For each level, collect resource creates via t.perform() and check for conflicts
    for (const [level, tasks] of tasksByLevel) {
      if (tasks.length < 2) continue;

      // Map: resourceType -> list of task codes that perform-create it
      const performCreates = new Map<string, string[]>();

      for (const task of tasks) {
        const ops = collectResourceOps(task.stepTree, nodes, task.taskCode, false);
        for (const op of ops) {
          if (op.op === 'create' && !op.viaEnsure) {
            const list = performCreates.get(op.resourceType) ?? [];
            list.push(task.taskCode);
            performCreates.set(op.resourceType, list);
          }
        }
      }

      for (const [resourceType, taskCodes] of performCreates) {
        // Deduplicate task codes (a task might create the same type multiple times)
        const unique = [...new Set(taskCodes)];
        if (unique.length > 1) {
          errors.push({
            type: 'resource_duplicate_perform_create',
            message:
              `Standalone tasks at level ${level} both perform-create resource type ` +
              `'${resourceType}': ${unique.map((c) => `'${c}'`).join(', ')}. ` +
              `This may cause conflicts at runtime. Consider using t.ensure() instead.`,
          });
        }
      }
    }
  }

  return errors;
}
