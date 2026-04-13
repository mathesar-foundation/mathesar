import type { StepNode } from '../types';

export interface StepTreeMismatch {
  message: string;
}

/**
 * Compare dry-run and execution step trees to detect conditional steps.
 *
 * Step structure must be deterministic regardless of runtime values.
 * If the trees differ, it means the scenario has conditional logic that
 * changes which steps run based on runtime data — which is not supported.
 */
export function compareStepTrees(
  testCode: string,
  dryRunTree: StepNode[],
  executionTree: StepNode[],
  path: string = testCode,
): StepTreeMismatch | null {
  if (dryRunTree.length !== executionTree.length) {
    return {
      message:
        `Step count mismatch in '${path}': ` +
        `dry-run had ${dryRunTree.length} steps, execution had ${executionTree.length}. ` +
        `This usually means your scenario has conditional steps based on runtime values, which is not supported.`,
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
          `This usually means your scenario has conditional steps based on runtime values, which is not supported.`,
      };
    }

    if (dryNode.label !== execNode.label) {
      return {
        message:
          `Step label mismatch in '${path}' at position ${i}: ` +
          `dry-run had '${dryNode.label}', execution had '${execNode.label}'. ` +
          `This usually means your scenario has conditional steps based on runtime values, which is not supported.`,
      };
    }

    if (dryNode.type === 'step' && execNode.type === 'step') {
      if (dryNode.testCode !== execNode.testCode) {
        return {
          message:
            `Step test reference mismatch at position ${i}: ` +
            `dry-run referenced '${dryNode.testCode}', execution referenced '${execNode.testCode}'. ` +
            `This usually means your scenario has conditional steps based on runtime values, which is not supported.`,
        };
      }

      const childMismatch = compareStepTrees(
        testCode,
        dryNode.children,
        execNode.children,
        `${path} > step '${dryNode.label}'`,
      );
      if (childMismatch) return childMismatch;
    }
  }

  return null;
}
