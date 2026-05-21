/**
 * Validate the test DAG.
 *
 * Imports all test files to populate the registry, then dry-runs all tasks
 * and scenarios, builds the DAG, and checks for cycles, missing references,
 * and resource lifecycle errors.
 *
 * Usage: npx tsx framework/scripts/validate-dag.ts
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { loadConfig } from './load-config';

async function main() {
  const { testsDir } = await loadConfig();
  const testFiles = fs
    .readdirSync(testsDir)
    .filter((f) => f.endsWith('.ts'))
    .map((f) => path.join(testsDir, f));

  if (testFiles.length === 0) {
    console.log('No test files found.');
    return;
  }

  // Import all test files to populate the registry
  for (const file of testFiles) {
    await import(file);
  }

  const { buildTaskDag } = await import('../src/engine/task-dag');
  const dag = await buildTaskDag();

  const taskCount = Array.from(dag.nodes.values()).filter((n) => !n.isScenario).length;
  const scenarioCount = Array.from(dag.nodes.values()).filter((n) => n.isScenario).length;

  console.log(`\nDAG Summary:`);
  console.log(`  Tasks: ${taskCount}`);
  console.log(`  Scenarios: ${scenarioCount}`);
  console.log(
    `  Standalone: ${Array.from(dag.nodes.values()).filter((n) => n.hasStandalone).length}`,
  );
  console.log(`  Topological order: ${dag.topologicalOrder.join(' -> ')}`);

  // Show composition edges
  for (const [, node] of dag.nodes) {
    if (node.composedTasks.length > 0) {
      console.log(`  ${node.taskCode} composes: ${node.composedTasks.join(', ')}`);
    }
  }

  if (dag.errors.length === 0) {
    console.log('\n  No errors found.');
  } else {
    console.error(`\n  ${dag.errors.length} error(s) found:\n`);
    for (const error of dag.errors) {
      console.error(`  [${error.type}] ${error.message}`);
    }
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Failed to validate DAG:', err);
  process.exit(1);
});
