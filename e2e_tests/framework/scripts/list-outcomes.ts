/**
 * List all registered tests with their composition structure.
 *
 * Usage: npx tsx framework/scripts/list-outcomes.ts
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

  for (const file of testFiles) {
    await import(file);
  }

  const { registry } = await import('../src/store/registry');
  const { buildDag } = await import('../src/engine/dag');

  const entries = registry.getAll();
  const dag = await buildDag();

  // Print table
  const header = [
    'TEST CODE'.padEnd(30),
    'STANDALONE'.padEnd(12),
    'COMPOSES',
  ].join(' ');
  const separator = '-'.repeat(header.length + 20);

  console.log(`\n${header}`);
  console.log(separator);

  for (const entry of entries) {
    const node = dag.nodes.get(entry.handle.code);
    const composed = node?.composedTests.join(', ') || '-';
    const row = [
      entry.handle.code.padEnd(30),
      (entry.standaloneParams !== undefined ? 'yes' : 'no').padEnd(12),
      composed,
    ].join(' ');
    console.log(row);
  }

  console.log(`\nTotal: ${entries.length} test(s)`);
}

main().catch((err) => {
  console.error('Failed to list tests:', err);
  process.exit(1);
});
