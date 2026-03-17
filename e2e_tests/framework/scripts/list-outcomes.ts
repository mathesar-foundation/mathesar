/**
 * List all registered outcomes with their producers and consumers.
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
  const tests = registry.getAll();

  // Build a map of outcome -> who produces it and who consumes it
  const outcomes = new Map<
    string,
    {
      producer: string;
      isStandalone: boolean;
      readConsumers: string[];
      writeConsumers: string[];
    }
  >();

  for (const test of tests) {
    outcomes.set(test.outcomeCode, {
      producer: test.testCode,
      isStandalone: test.isStandalone,
      readConsumers: [],
      writeConsumers: [],
    });
  }

  for (const test of tests) {
    const requirements = test.getRequirements();
    for (const req of requirements) {
      const entry = outcomes.get(req.outcomeCode);
      if (entry) {
        if (req.access === 'write') {
          entry.writeConsumers.push(test.outcomeCode);
        } else {
          entry.readConsumers.push(test.outcomeCode);
        }
      }
    }
  }

  // Print table
  const header = [
    'OUTCOME'.padEnd(45),
    'PRODUCED BY'.padEnd(20),
    'TYPE'.padEnd(12),
    'READ BY'.padEnd(30),
    'WRITTEN BY',
  ].join(' ');
  const separator = '-'.repeat(header.length);

  console.log(`\n${header}`);
  console.log(separator);

  for (const [code, info] of outcomes) {
    const row = [
      code.padEnd(45),
      info.producer.padEnd(20),
      (info.isStandalone ? 'standalone' : 'instance').padEnd(12),
      (info.readConsumers.join(', ') || '-').padEnd(30),
      info.writeConsumers.join(', ') || '-',
    ].join(' ');
    console.log(row);
  }

  console.log(`\nTotal: ${outcomes.size} outcomes`);
}

main().catch((err) => {
  console.error('Failed to list outcomes:', err);
  process.exit(1);
});
