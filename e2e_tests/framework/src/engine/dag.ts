import type { StepNode } from '../types';
import { registry, isTestHandle } from '../store/registry';
import { dryRun } from './dry-run';

export interface DagNode {
  testCode: string;
  hasStandalone: boolean;
  stepTree: StepNode[];
  /** Test codes referenced via t.step() — direct children only */
  composedTests: string[];
}

export interface DagValidationError {
  type: 'cycle' | 'missing_test';
  message: string;
}

export interface Dag {
  nodes: Map<string, DagNode>;
  errors: DagValidationError[];
  topologicalOrder: string[];
}

/**
 * Build the DAG by dry-running all registered tests and analyzing their step trees.
 *
 * The DAG captures which tests compose which other tests via t.step().
 * It detects cycles and missing test references.
 */
export async function buildDag(): Promise<Dag> {
  const entries = registry.getAll();
  const nodes = new Map<string, DagNode>();
  const errors: DagValidationError[] = [];

  // Dry-run each registered test to capture step trees
  // Note: only legacy TestHandle entries are processed here.
  // TaskHandle entries will be processed by the task DAG builder.
  for (const entry of entries) {
    const { handle, standaloneParams } = entry;
    if (!isTestHandle(handle)) continue;
    try {
      const result = await dryRun(handle, standaloneParams);
      const composedTests = extractComposedTests(result.stepTree);

      nodes.set(handle.code, {
        testCode: handle.code,
        hasStandalone: standaloneParams !== undefined,
        stepTree: result.stepTree,
        composedTests,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const isCycle = message.includes('Circular dependency');
      errors.push({
        type: isCycle ? 'cycle' : 'missing_test',
        message: isCycle
          ? message
          : `Failed to dry-run test '${handle.code}': ${message}`,
      });
    }
  }

  // Check for missing test references
  for (const [, node] of nodes) {
    for (const composedCode of node.composedTests) {
      if (!nodes.has(composedCode) && !registry.has(composedCode)) {
        errors.push({
          type: 'missing_test',
          message:
            `Test '${node.testCode}' references test '${composedCode}' via t.step(), ` +
            `but '${composedCode}' is not registered.`,
        });
      }
    }
  }

  // Cycle detection + topological sort
  const topologicalOrder: string[] = [];
  const visited = new Set<string>();
  const visiting = new Set<string>();

  function visit(code: string): boolean {
    if (visited.has(code)) return true;
    if (visiting.has(code)) return false;

    visiting.add(code);
    const node = nodes.get(code);
    if (node) {
      for (const dep of node.composedTests) {
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
 * Compute the execution level for each test in the DAG.
 *
 * Level = longest path from any root (test with no dependencies).
 * Tests at the same level are independent and can run in parallel.
 * Tests at level N depend only on tests at levels < N.
 *
 * Must be called after buildDag() with a valid (error-free) DAG.
 */
export function computeLevels(dag: Dag): Map<string, number> {
  const levels = new Map<string, number>();
  for (const code of dag.topologicalOrder) {
    const node = dag.nodes.get(code);
    if (!node || node.composedTests.length === 0) {
      levels.set(code, 0);
    } else {
      const maxDepLevel = Math.max(
        ...node.composedTests.map((dep) => levels.get(dep) ?? 0),
      );
      levels.set(code, maxDepLevel + 1);
    }
  }
  return levels;
}

/**
 * Extract the set of test codes referenced by t.step() in a step tree.
 * Collects from all nesting levels.
 */
function extractComposedTests(tree: StepNode[]): string[] {
  const codes = new Set<string>();

  function walk(nodes: StepNode[]) {
    for (const node of nodes) {
      if (node.type === 'step') {
        codes.add(node.testCode);
        // Don't recurse into children — those are the sub-test's own steps.
        // We only want direct composition edges for the DAG.
      }
    }
  }

  walk(tree);
  return Array.from(codes);
}
