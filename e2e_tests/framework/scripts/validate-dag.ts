/**
 * Validate the test DAG.
 *
 * Imports all test files to populate the registry, then dry-runs all tests,
 * builds the DAG, and checks for cycles and missing references.
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

  const { buildDag } = await import('../src/engine/dag');
  const dag = await buildDag();

  console.log(`\nDAG Summary:`);
  console.log(`  Nodes: ${dag.nodes.size}`);
  console.log(
    `  Standalone tests: ${Array.from(dag.nodes.values()).filter((n) => n.hasStandalone).length}`,
  );
  console.log(`  Topological order: ${dag.topologicalOrder.join(' -> ')}`);

  // Show composition edges
  for (const [, node] of dag.nodes) {
    if (node.composedTests.length > 0) {
      console.log(`  ${node.testCode} composes: ${node.composedTests.join(', ')}`);
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
