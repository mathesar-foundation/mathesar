/**
 * Visualize the test DAG as a Mermaid diagram.
 *
 * Usage: npx tsx framework/scripts/visualize-dag.ts
 *
 * Copy the output into a Mermaid renderer (e.g., https://mermaid.live)
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

  const { buildDag } = await import('../src/engine/dag');
  const dag = buildDag();

  const lines: string[] = ['graph TD'];

  // Create node labels
  const nodeIds = new Map<string, string>();
  let idCounter = 0;
  for (const [code, node] of dag.nodes) {
    const id = `N${idCounter++}`;
    nodeIds.set(code, id);
    const style = node.isStandalone ? `[${code}]` : `([${code}])`;
    lines.push(`  ${id}${style}`);
  }

  // Create edges
  for (const [code, node] of dag.nodes) {
    const toId = nodeIds.get(code)!;
    for (const req of node.requirements) {
      const fromId = nodeIds.get(req.outcomeCode);
      if (fromId) {
        const label = req.access === 'write' ? '-->|write|' : '-->';
        lines.push(`  ${fromId} ${label} ${toId}`);
      }
    }
  }

  console.log(lines.join('\n'));
}

main().catch((err) => {
  console.error('Failed to visualize DAG:', err);
  process.exit(1);
});
