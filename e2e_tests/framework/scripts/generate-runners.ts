/**
 * Auto-generate Playwright test runner files from test definitions.
 *
 * Reads all *.ts files in the tests directory and generates corresponding
 * .generated/<name>.test.ts wrappers. Each wrapper performs a side-effect
 * import of the definition (populating the registry) and calls runFlow
 * with the test code string.
 *
 * Convention: file name = test code (install.ts → code "install")
 *
 * Usage:
 *   npx tsx framework/scripts/generate-runners.ts   (standalone)
 *   Also runs automatically via the screenwriter wrapper on every test invocation.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

export interface RunnerGeneratorConfig {
  testsDir: string;
  generatedDir: string;
  frameworkImport: string;
  testsImport: string;
}

function generateRunner(
  testCode: string,
  config: RunnerGeneratorConfig,
): string {
  return `// Auto-generated from ${testCode}.ts — do not edit
import { test } from '@playwright/test';
import { runFlow } from '${config.frameworkImport}';
import '${config.testsImport}/${testCode}';

test('${testCode}', async ({ page }) => {
  await runFlow(page, '${testCode}');
});
`;
}

export function generateRunners(config: RunnerGeneratorConfig): void {
  if (!fs.existsSync(config.testsDir)) {
    return;
  }

  const testFiles = fs
    .readdirSync(config.testsDir)
    .filter((f) => f.endsWith('.ts') && !f.endsWith('.d.ts') && !f.endsWith('.test.ts'));

  if (testFiles.length === 0) {
    return;
  }

  // Ensure generated dir exists and remove stale runners
  if (fs.existsSync(config.generatedDir)) {
    for (const file of fs.readdirSync(config.generatedDir)) {
      if (file.endsWith('.test.ts')) {
        fs.unlinkSync(path.join(config.generatedDir, file));
      }
    }
  } else {
    fs.mkdirSync(config.generatedDir, { recursive: true });
  }

  for (const file of testFiles) {
    const testCode = file.replace(/\.ts$/, '');
    const runnerPath = path.join(config.generatedDir, `${testCode}.test.ts`);
    fs.writeFileSync(runnerPath, generateRunner(testCode, config));
  }
}

// Run directly via CLI
if (require.main === module) {
  (async () => {
    const { loadConfig } = await import('./load-config');
    const { toRelativePosix } = await import('../src/config');
    const config = await loadConfig();

    const frameworkImport = toRelativePosix(config.generatedDir, config.frameworkSrcDir);
    const testsImport = toRelativePosix(config.generatedDir, config.testsDir);
    generateRunners({
      testsDir: config.testsDir,
      generatedDir: config.generatedDir,
      frameworkImport,
      testsImport,
    });

    const count = fs.existsSync(config.generatedDir)
      ? fs.readdirSync(config.generatedDir).filter((f) => f.endsWith('.test.ts')).length
      : 0;
    console.log(`Generated ${count} test runner(s) in .generated/.`);
  })().catch((err) => {
    console.error('Failed to generate runners:', err);
    process.exit(1);
  });
}
