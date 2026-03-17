/**
 * Validate the test DAG.
 *
 * Imports all test files to populate the registry, then builds the DAG
 * and checks for cycles, missing outcomes, and write conflicts.
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
  const dag = buildDag();

  console.log(`\nDAG Summary:`);
  console.log(`  Nodes: ${dag.nodes.size}`);
  console.log(
    `  Standalone tests: ${Array.from(dag.nodes.values()).filter((n) => n.isStandalone).length}`,
  );
  console.log(
    `  Parameterized instances: ${Array.from(dag.nodes.values()).filter((n) => !n.isStandalone).length}`,
  );
  console.log(`  Topological order: ${dag.topologicalOrder.join(' -> ')}`);

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
