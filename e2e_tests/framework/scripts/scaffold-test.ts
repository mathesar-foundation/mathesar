/**
 * Generate a task definition file skeleton using the composable API.
 *
 * Usage:
 *   npx tsx framework/scripts/scaffold-test.ts --code create-table --requires login
 *
 * Options:
 *   --code       Task code (required, used as filename and task identifier)
 *   --requires   Task codes to compose via t.ensure() (comma-separated)
 *   --config     Path to screenwriter config file (default: screenwriter.config.ts in cwd)
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { loadConfig } from './load-config';
import { toRelativePosix } from '../src/config';

interface ScaffoldOptions {
  code: string;
  requires: string[];
}

function parseArgs(args: string[]): ScaffoldOptions {
  const opts: ScaffoldOptions = {
    code: '',
    requires: [],
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--code':
        opts.code = args[++i];
        break;
      case '--requires':
        opts.requires = args[++i].split(',').map((s) => s.trim());
        break;
      case '--config':
        i++; // consumed by loadConfig
        break;
    }
  }

  if (!opts.code) {
    console.error('Error: --code is required');
    process.exit(1);
  }

  return opts;
}

function toPascalCase(code: string): string {
  return code
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

function toCamelCase(code: string): string {
  const pascal = toPascalCase(code);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

function generateTestFile(
  opts: ScaffoldOptions,
  frameworkImport: string,
): string {
  const varName = toCamelCase(opts.code);
  const outcomeName = `${toCamelCase(opts.code)}Outcome`;
  const lines: string[] = [];

  // Imports
  lines.push(`import { z } from 'zod';`);
  lines.push(`import { defineTask } from '${frameworkImport}';`);
  if (opts.requires.length > 0) {
    for (const req of opts.requires) {
      lines.push(`import { ${toCamelCase(req)} } from './${req}';`);
    }
  }

  lines.push('');

  // Schemas
  lines.push(`const ${varName}Params = z.object({`);
  lines.push('  // TODO: Define params');
  lines.push('});');
  lines.push('');
  lines.push(`const ${outcomeName} = z.object({`);
  lines.push('  // TODO: Define outcome data');
  lines.push('});');
  lines.push('');

  // defineTask call
  lines.push(`export const ${varName} = defineTask({`);
  lines.push(`  code: '${opts.code}',`);
  lines.push(`  params: ${varName}Params,`);
  lines.push(`  outcome: ${outcomeName},`);
  lines.push('');
  lines.push('  task: async (t, params) => {');

  // Add t.ensure() calls for requirements
  for (const req of opts.requires) {
    const reqVar = toCamelCase(req);
    lines.push(`    await t.ensure(${reqVar}, {});`);
  }

  lines.push('');
  lines.push('    // TODO: Add actions and checks');
  lines.push('');
  lines.push(`    return {} as z.infer<typeof ${outcomeName}>;`);
  lines.push('  },');
  lines.push('');
  lines.push('  standalone: {');
  lines.push(`    params: {} as z.infer<typeof ${varName}Params>,`);
  lines.push('  },');
  lines.push('});');
  lines.push('');

  return lines.join('\n');
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const { testsDir, frameworkSrcDir } = await loadConfig();

  // Compute the relative import path from testsDir to framework/src
  const frameworkImport = toRelativePosix(testsDir, frameworkSrcDir);

  const outputPath = path.join(testsDir, `${opts.code}.ts`);

  if (fs.existsSync(outputPath)) {
    console.error(`Error: ${outputPath} already exists. Will not overwrite.`);
    process.exit(1);
  }

  const content = generateTestFile(opts, frameworkImport);
  fs.mkdirSync(testsDir, { recursive: true });
  fs.writeFileSync(outputPath, content);
  console.log(`Created task definition: ${path.relative(process.cwd(), outputPath)}`);
}

main().catch((err) => {
  console.error('Failed to scaffold test:', err);
  process.exit(1);
});
