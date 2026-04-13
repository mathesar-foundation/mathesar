/**
 * Visualize the test DAG as a Mermaid diagram.
 *
 * Shows task and scenario composition as a directed graph with step trees.
 *
 * Usage: npx tsx framework/scripts/visualize-dag.ts
 *
 * Copy the output into a Mermaid renderer (e.g., https://mermaid.live)
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import type { TaskStepNode } from '../src/types';
import { loadConfig } from './load-config';

async function main() {
  const { testsDir } = await loadConfig();
  const testFiles = fs
    .readdirSync(testsDir)
    .filter((f) => f.endsWith('.ts'))
    .map((f) => path.join(testsDir, f));

  for (const file of testFiles) {
    await import(file);
  }

  const { buildTaskDag } = await import('../src/engine/task-dag');
  const dag = await buildTaskDag();

  const lines: string[] = ['graph TD'];

  // Create node labels
  const nodeIds = new Map<string, string>();
  let idCounter = 0;
  for (const [code, node] of dag.nodes) {
    const id = `N${idCounter++}`;
    nodeIds.set(code, id);
    const style = node.isScenario
      ? `{${code}}`  // diamond for scenarios
      : node.hasStandalone
        ? `[${code}]`
        : `([${code}])`;
    lines.push(`  ${id}${style}`);
  }

  // Create composition edges
  for (const [code, node] of dag.nodes) {
    const toId = nodeIds.get(code)!;
    for (const composedCode of node.composedTasks) {
      const fromId = nodeIds.get(composedCode);
      if (fromId) {
        lines.push(`  ${fromId} --> ${toId}`);
      }
    }
  }

  // Add step tree details as subgraphs
  for (const [code, node] of dag.nodes) {
    if (node.stepTree.length > 0) {
      lines.push(`  subgraph ${code}_steps["${code} steps"]`);
      let stepCounter = 0;
      for (const step of node.stepTree) {
        const stepId = `${nodeIds.get(code)}_S${stepCounter++}`;
        let label: string;
        if (step.type === 'ensure' || step.type === 'perform') {
          label = `${step.type}: ${step.label} → ${step.taskCode}`;
        } else {
          label = `${step.type}: ${step.label}`;
        }
        lines.push(`    ${stepId}["${label}"]`);
      }
      lines.push('  end');
    }
  }

  console.log(lines.join('\n'));
}

main().catch((err) => {
  console.error('Failed to visualize DAG:', err);
  process.exit(1);
});
