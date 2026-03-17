/**
 * Screenwriter CLI wrapper — the main entry point for running tests.
 *
 * Orchestrates the full pipeline:
 *   1. Load configuration
 *   2. Generate Playwright runner files
 *   3. Load test definitions and validate the dependency DAG
 *   4. Run Playwright
 *
 * Usage:
 *   npx tsx framework/scripts/screenwriter.ts [playwright args...]
 *   npx tsx framework/scripts/screenwriter.ts --config path/to/config.ts [playwright args...]
 */

import { spawnSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { getResolvedConfig, toRelativePosix } from '../src/config';
import { buildDag } from '../src/engine/dag';
import { generateRunners } from './generate-runners';

function getConfigPath(args: string[]): { configPath: string; extraArgs: string[] } {
  const idx = args.indexOf('--config');
  if (idx !== -1 && args[idx + 1]) {
    const configPath = path.resolve(args[idx + 1]);
    const extraArgs = [...args.slice(0, idx), ...args.slice(idx + 2)];
    return { configPath, extraArgs };
  }
  return {
    configPath: path.join(process.cwd(), 'screenwriter.config.ts'),
    extraArgs: [...args],
  };
}

function loadTestFiles(testsDir: string): void {
  const files = fs
    .readdirSync(testsDir)
    .filter((f) => f.endsWith('.ts') && !f.endsWith('.d.ts') && !f.endsWith('.test.ts'));
  for (const file of files) {
    require(path.join(testsDir, file));
  }
}

async function main() {
  const { configPath, extraArgs } = getConfigPath(process.argv.slice(2));

  // 1. Load configuration
  await import(configPath);
  const config = getResolvedConfig();

  // 2. Generate Playwright runner files
  const frameworkImport = toRelativePosix(config.generatedDir, config.frameworkSrcDir);
  const testsImport = toRelativePosix(config.generatedDir, config.testsDir);
  generateRunners({
    testsDir: config.testsDir,
    generatedDir: config.generatedDir,
    frameworkImport,
    testsImport,
  });

  // 3. Load test definitions and validate the dependency DAG
  loadTestFiles(config.testsDir);
  const dag = buildDag();
  if (dag.errors.length > 0) {
    const messages = dag.errors.map((e) => `  [${e.type}] ${e.message}`).join('\n');
    console.error('DAG validation failed:\n' + messages);
    process.exit(1);
  }

  // 4. Run Playwright
  const result = spawnSync(
    'npx',
    ['playwright', 'test', '--config', configPath, ...extraArgs],
    { stdio: 'inherit', cwd: process.cwd() },
  );
  process.exit(result.status ?? 1);
}

main().catch((err) => {
  console.error('Screenwriter failed:', err);
  process.exit(1);
});
