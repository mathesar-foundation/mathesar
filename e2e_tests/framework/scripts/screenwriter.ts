/**
 * Screenwriter CLI wrapper — the main entry point for running tests.
 *
 * Orchestrates the full pipeline:
 *   1. Load configuration
 *   2. Load test definitions
 *   3. Dry-run all tests and build/validate the DAG
 *   4. Compute execution levels from the DAG
 *   5. Generate Playwright runner files grouped by level
 *   6. Generate dynamic Playwright config with project dependencies
 *   7. Run Playwright
 *
 * Usage:
 *   npx tsx framework/scripts/screenwriter.ts [playwright args...]
 *   npx tsx framework/scripts/screenwriter.ts --config path/to/config.ts [playwright args...]
 */

import { spawnSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { getResolvedConfig, toRelativePosix } from '../src/config';
import { buildDag, computeLevels } from '../src/engine/dag';
import { buildTaskDag, computeTaskLevels } from '../src/engine/task-dag';
import { registry, isTaskHandle } from '../src/store/registry';
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

/**
 * Generate a dynamic Playwright config file based on the DAG levels.
 *
 * Each level becomes a Playwright project with dependencies on the previous level.
 * Tests within a level run in parallel across workers.
 */
function generatePlaywrightConfig(
  outputDir: string,
  maxLevel: number,
  config: ReturnType<typeof getResolvedConfig>,
  userPlaywright: Record<string, unknown>,
): string {
  const globalSetupPath = toRelativePosix(
    outputDir,
    path.resolve(__dirname, '..', 'src', 'engine', 'global-setup'),
  );

  const projects: Array<{
    name: string;
    testDir: string;
    dependencies?: string[];
  }> = [];

  for (let level = 0; level <= maxLevel; level++) {
    projects.push({
      name: `phase-${level}`,
      testDir: `./runners/phase-${level}`,
      ...(level > 0 ? { dependencies: [`phase-${level - 1}`] } : {}),
    });
  }

  // Extract user config fields (exclude projects, testDir, globalSetup — we manage those)
  const {
    projects: _projects,
    testDir: _testDir,
    globalSetup: _globalSetup,
    ...restPlaywright
  } = userPlaywright;

  const configObj = {
    ...restPlaywright,
    globalSetup: globalSetupPath,
    use: {
      ...((restPlaywright.use as Record<string, unknown>) ?? {}),
      baseURL: config.baseURL,
    },
    projects,
  };

  return `// Auto-generated Playwright config — do not edit
import { defineConfig } from '@playwright/test';

export default defineConfig(${JSON.stringify(configObj, null, 2)});
`;
}

async function main() {
  const { configPath, extraArgs } = getConfigPath(process.argv.slice(2));

  // 1. Load configuration (triggers createPlaywrightConfig which stores resolved config)
  await import(configPath);
  const config = getResolvedConfig();

  // 2. Load test definitions (populates registry)
  loadTestFiles(config.testsDir);

  // 3. Dry-run all tests/tasks and build/validate DAGs
  // Build legacy DAG for TestHandle entries
  const legacyDag = await buildDag();
  // Build task DAG for TaskHandle entries
  const taskDag = await buildTaskDag();

  const allErrors = [...legacyDag.errors, ...taskDag.errors];
  if (allErrors.length > 0) {
    const messages = allErrors.map((e) => `  [${e.type}] ${e.message}`).join('\n');
    console.error('DAG validation failed:\n' + messages);
    process.exit(1);
  }

  const totalNodes = legacyDag.nodes.size + taskDag.nodes.size;
  console.log(`DAG validated: ${totalNodes} entry/entries, no errors.`);

  // 4. Compute execution levels (merge both DAGs)
  const legacyLevels = computeLevels(legacyDag);
  const taskLevels = computeTaskLevels(taskDag);
  const levels = new Map<string, number>([...legacyLevels, ...taskLevels]);

  // Collect standalone codes and task codes
  const standaloneCodes = new Set<string>();
  const taskCodes = new Set<string>();
  for (const entry of registry.getStandalone()) {
    standaloneCodes.add(entry.handle.code);
    if (isTaskHandle(entry.handle)) {
      taskCodes.add(entry.handle.code);
    }
  }

  // 5. Generate runner files grouped by level
  const frameworkImport = toRelativePosix(config.runnersDir, config.frameworkSrcDir);
  const testsImport = toRelativePosix(config.runnersDir, config.testsDir);
  const { maxLevel } = generateRunners({
    testsDir: config.testsDir,
    generatedDir: config.runnersDir,
    frameworkImport,
    testsImport,
    levels,
    standaloneCodes,
    taskCodes,
  });

  // 6. Generate dynamic Playwright config
  // Re-read the user's screenwriter config to get raw playwright options
  const userModule = await import(configPath);
  const userConfig = userModule.screenwriterConfig ?? userModule.default?.screenwriterConfig;
  const userPlaywright = (userConfig?.playwright ?? {}) as Record<string, unknown>;

  const playwrightConfigContent = generatePlaywrightConfig(
    config.outputDir,
    maxLevel >= 0 ? maxLevel : 0,
    config,
    userPlaywright,
  );
  const playwrightConfigPath = path.join(config.outputDir, 'playwright.config.ts');
  if (!fs.existsSync(config.outputDir)) {
    fs.mkdirSync(config.outputDir, { recursive: true });
  }
  fs.writeFileSync(playwrightConfigPath, playwrightConfigContent);

  console.log(`Generated ${standaloneCodes.size} runner(s) across ${maxLevel + 1} phase(s).`);

  // 7. Run Playwright with the generated config
  const result = spawnSync(
    'npx',
    ['playwright', 'test', '--config', playwrightConfigPath, ...extraArgs],
    {
      stdio: 'inherit',
      cwd: process.cwd(),
      env: { ...process.env, SCREENWRITER_BASE_URL: config.baseURL },
    },
  );
  process.exit(result.status ?? 1);
}

main().catch((err) => {
  console.error('Screenwriter failed:', err);
  process.exit(1);
});
