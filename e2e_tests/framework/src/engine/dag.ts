import type { AccessMode } from '../types';
import { registry } from '../store/registry';

export interface DagNode {
  outcomeCode: string;
  testCode: string;
  isStandalone: boolean;
  requirements: { outcomeCode: string; access: AccessMode }[];
}

export interface DagValidationError {
  type: 'cycle' | 'missing_outcome' | 'write_conflict';
  message: string;
}

export interface Dag {
  nodes: Map<string, DagNode>;
  errors: DagValidationError[];
  topologicalOrder: string[];
}

export function buildDag(): Dag {
  const tests = registry.getAll();
  const nodes = new Map<string, DagNode>();
  const errors: DagValidationError[] = [];

  for (const test of tests) {
    const requirements = test.getRequirements();
    nodes.set(test.outcomeCode, {
      outcomeCode: test.outcomeCode,
      testCode: test.testCode,
      isStandalone: test.isStandalone,
      requirements: requirements.map((r) => ({
        outcomeCode: r.outcomeCode,
        access: r.access,
      })),
    });
  }

  // Check for missing outcomes
  for (const [, node] of nodes) {
    for (const req of node.requirements) {
      if (!nodes.has(req.outcomeCode)) {
        errors.push({
          type: 'missing_outcome',
          message:
            `Test '${node.outcomeCode}' requires '${req.outcomeCode}' ` +
            `which is not registered`,
        });
      }
    }
  }

  // Check for write conflicts: two write consumers of the same outcome
  // with no dependency chain between them
  const outcomeWriters = new Map<string, string[]>();
  for (const [, node] of nodes) {
    for (const req of node.requirements) {
      if (req.access === 'write') {
        const writers = outcomeWriters.get(req.outcomeCode) || [];
        writers.push(node.outcomeCode);
        outcomeWriters.set(req.outcomeCode, writers);
      }
    }
  }
  for (const [outcome, writers] of outcomeWriters) {
    if (writers.length > 1) {
      // Check if any pair of writers has no dependency between them
      for (let i = 0; i < writers.length; i++) {
        for (let j = i + 1; j < writers.length; j++) {
          if (
            !hasPath(nodes, writers[i], writers[j]) &&
            !hasPath(nodes, writers[j], writers[i])
          ) {
            errors.push({
              type: 'write_conflict',
              message:
                `Tests '${writers[i]}' and '${writers[j]}' both write to ` +
                `'${outcome}' but have no dependency between them. ` +
                `They could run in parallel and conflict.`,
            });
          }
        }
      }
    }
  }

  // Topological sort + cycle detection
  const topologicalOrder: string[] = [];
  const visited = new Set<string>();
  const visiting = new Set<string>();

  function visit(code: string): boolean {
    if (visited.has(code)) return true;
    if (visiting.has(code)) return false; // cycle

    visiting.add(code);
    const node = nodes.get(code);
    if (node) {
      for (const req of node.requirements) {
        if (!visit(req.outcomeCode)) {
          errors.push({
            type: 'cycle',
            message: `Circular dependency detected involving '${code}' and '${req.outcomeCode}'`,
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

function hasPath(
  nodes: Map<string, DagNode>,
  from: string,
  to: string,
): boolean {
  const visited = new Set<string>();
  const queue = [from];
  while (queue.length > 0) {
    const current = queue.shift()!;
    if (current === to) return true;
    if (visited.has(current)) continue;
    visited.add(current);
    const node = nodes.get(current);
    if (node) {
      for (const req of node.requirements) {
        queue.push(req.outcomeCode);
      }
    }
  }
  return false;
}
