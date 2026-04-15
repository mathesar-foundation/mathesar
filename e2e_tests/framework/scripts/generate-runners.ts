/**
 * Auto-generate Playwright test runner files from test definitions.
 *
 * Generates runner files grouped by execution level (from DAG analysis)
 * into phase-specific subdirectories:
 *   .output/runners/phase-0/install.test.ts
 *   .output/runners/phase-1/login.test.ts
 *   .output/runners/phase-2/create-database.test.ts
 *
 * Each wrapper performs a side-effect import of the definition (populating
 * the registry) and calls runFlow with the test code string.
 *
 * Convention: file name = test code (install.ts -> code "install")
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

export interface RunnerGeneratorConfig {
  testsDir: string;
  generatedDir: string;
  frameworkImport: string;
  testsImport: string;
  /** Map of testCode -> level. If not provided, all tests go to phase-0. */
  levels?: Map<string, number>;
  /** Set of test codes that have standalone params. Only these get runners. */
  standaloneCodes?: Set<string>;
  /** Set of test codes that are ScenarioHandle. Uses runScenarioFlow. */
  scenarioCodes?: Set<string>;
}

function generateRunner(
  testCode: string,
  config: RunnerGeneratorConfig,
  phaseDir: string,
): string {
  const frameworkImport = toRelativePosix(phaseDir, path.resolve(config.generatedDir, config.frameworkImport));
  const testsImport = toRelativePosix(phaseDir, path.resolve(config.generatedDir, config.testsImport));

  const isScenario = config.scenarioCodes?.has(testCode) ?? false;
  const runFn = isScenario ? 'runScenarioFlow' : 'runTaskFlow';

  // Scenarios compose many tasks and can run for several minutes. Give them
  // a generous ceiling so they don't hit Playwright's 30s default.
  const timeoutMs = isScenario ? 20 * 60 * 1000 : undefined;
  const timeoutLine = timeoutMs !== undefined
    ? `\n  test.setTimeout(${timeoutMs});`
    : '';

  return `// Auto-generated from ${testCode}.ts — do not edit
import { test } from '@playwright/test';
import { ${runFn} } from '${frameworkImport}';
import '${testsImport}/${testCode}';

test('${testCode}', async ({ page, baseURL, request }) => {${timeoutLine}
  await ${runFn}({ page, baseURL: baseURL!, request }, '${testCode}');
});
`;
}

function toRelativePosix(from: string, to: string): string {
  return path.relative(from, to).split(path.sep).join('/');
}

export function generateRunners(config: RunnerGeneratorConfig): { maxLevel: number } {
  if (!fs.existsSync(config.testsDir)) {
    return { maxLevel: -1 };
  }

  const testFiles = fs
    .readdirSync(config.testsDir)
    .filter((f) => f.endsWith('.ts') && !f.endsWith('.d.ts') && !f.endsWith('.test.ts'));

  if (testFiles.length === 0) {
    return { maxLevel: -1 };
  }

  // Clean the generated directory
  if (fs.existsSync(config.generatedDir)) {
    fs.rmSync(config.generatedDir, { recursive: true, force: true });
  }
  fs.mkdirSync(config.generatedDir, { recursive: true });

  let maxLevel = 0;

  for (const file of testFiles) {
    const testCode = file.replace(/\.ts$/, '');

    // Only generate runners for standalone tests
    if (config.standaloneCodes && !config.standaloneCodes.has(testCode)) {
      continue;
    }

    const level = config.levels?.get(testCode) ?? 0;
    if (level > maxLevel) maxLevel = level;

    const phaseDir = path.join(config.generatedDir, `phase-${level}`);
    if (!fs.existsSync(phaseDir)) {
      fs.mkdirSync(phaseDir, { recursive: true });
    }

    const runnerPath = path.join(phaseDir, `${testCode}.test.ts`);
    fs.writeFileSync(runnerPath, generateRunner(testCode, config, phaseDir));
  }

  return { maxLevel };
}

// Run directly via CLI
if (require.main === module) {
  (async () => {
    const { loadConfig } = await import('./load-config');
    const config = await loadConfig();

    const frameworkSrcDir = path.resolve(__dirname, '..', 'src');
    const frameworkImport = toRelativePosix(config.runnersDir, frameworkSrcDir);
    const testsImport = toRelativePosix(config.runnersDir, config.testsDir);
    const result = generateRunners({
      testsDir: config.testsDir,
      generatedDir: config.runnersDir,
      frameworkImport,
      testsImport,
    });

    const count = fs.existsSync(config.runnersDir)
      ? countGeneratedFiles(config.runnersDir)
      : 0;
    console.log(`Generated ${count} test runner(s) in .output/runners/ (max level: ${result.maxLevel}).`);
  })().catch((err) => {
    console.error('Failed to generate runners:', err);
    process.exit(1);
  });
}

function countGeneratedFiles(dir: string): number {
  let count = 0;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      count += countGeneratedFiles(path.join(dir, entry.name));
    } else if (entry.name.endsWith('.test.ts')) {
      count++;
    }
  }
  return count;
}
