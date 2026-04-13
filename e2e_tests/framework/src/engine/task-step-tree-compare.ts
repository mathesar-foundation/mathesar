import type { TaskStepNode } from '../types';

export interface TaskStepTreeMismatch {
  message: string;
}

/**
 * Compare dry-run and execution step trees for the new task model.
 * Same logic as compareStepTrees but for TaskStepNode (ensure/perform instead of step).
 */
export function compareTaskStepTrees(
  taskCode: string,
  dryRunTree: TaskStepNode[],
  executionTree: TaskStepNode[],
  path: string = taskCode,
): TaskStepTreeMismatch | null {
  if (dryRunTree.length !== executionTree.length) {
    return {
      message:
        `Step count mismatch in '${path}': ` +
        `dry-run had ${dryRunTree.length} steps, execution had ${executionTree.length}. ` +
        `This usually means your task has conditional steps based on runtime values, which is not supported.`,
    };
  }

  for (let i = 0; i < dryRunTree.length; i++) {
    const dryNode = dryRunTree[i];
    const execNode = executionTree[i];

    if (dryNode.type !== execNode.type) {
      return {
        message:
          `Step type mismatch in '${path}' at position ${i}: ` +
          `dry-run had '${dryNode.type}', execution had '${execNode.type}'. ` +
          `This usually means your task has conditional steps based on runtime values, which is not supported.`,
      };
    }

    if (dryNode.label !== execNode.label) {
      return {
        message:
          `Step label mismatch in '${path}' at position ${i}: ` +
          `dry-run had '${dryNode.label}', execution had '${execNode.label}'. ` +
          `This usually means your task has conditional steps based on runtime values, which is not supported.`,
      };
    }

    if (
      (dryNode.type === 'ensure' || dryNode.type === 'perform') &&
      (execNode.type === 'ensure' || execNode.type === 'perform')
    ) {
      if (dryNode.taskCode !== execNode.taskCode) {
        return {
          message:
            `Task reference mismatch at position ${i}: ` +
            `dry-run referenced '${dryNode.taskCode}', execution referenced '${execNode.taskCode}'. ` +
            `This usually means your task has conditional steps based on runtime values, which is not supported.`,
        };
      }

      const childMismatch = compareTaskStepTrees(
        taskCode,
        dryNode.children,
        execNode.children,
        `${path} > ${dryNode.type} '${dryNode.label}'`,
      );
      if (childMismatch) return childMismatch;
    }
  }

  return null;
}
