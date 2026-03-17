/**
 * Generate a test definition file skeleton.
 *
 * Usage:
 *   npx tsx framework/scripts/scaffold-test.ts --code create-table --primary table --params database=default,user=admin --requires login
 *
 * Options:
 *   --code       Test code (required, used as filename and test identifier)
 *   --primary    Primary param names (comma-separated)
 *   --params     All param names with optional defaults (comma-separated, e.g. "database=default,user=admin")
 *   --requires   Required test codes (comma-separated)
 *   --config     Path to screenwriter config file (default: screenwriter.config.ts in cwd)
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { loadConfig } from './load-config';
import { toRelativePosix } from '../src/config';

interface ScaffoldOptions {
  code: string;
  params: { name: string; default: string }[];
  primaryParams: string[];
  requires: string[];
}

function parseArgs(args: string[]): ScaffoldOptions {
  const opts: ScaffoldOptions = {
    code: '',
    params: [],
    primaryParams: [],
    requires: [],
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--code':
        opts.code = args[++i];
        break;
      case '--primary':
        opts.primaryParams = args[++i].split(',').map((s) => s.trim());
        break;
      case '--params':
        opts.params = args[++i].split(',').map((s) => {
          const [name, def] = s.trim().split('=');
          return { name, default: def ?? `'default_${name}'` };
        });
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

function quoteDefault(value: string): string {
  if (
    value.startsWith("'") ||
    value.startsWith('"') ||
    value === 'true' ||
    value === 'false' ||
    !isNaN(Number(value))
  ) {
    return value;
  }
  return `'${value}'`;
}

function toPascalCase(code: string): string {
  return code
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

function generateTestFile(
  opts: ScaffoldOptions,
  frameworkImport: string,
): string {
  const outcomeName = `${toPascalCase(opts.code)}Outcome`;
  const hasParams = opts.params.length > 0;
  const lines: string[] = [];

  // Imports
  lines.push(`import { defineTest } from '${frameworkImport}';`);
  if (opts.requires.length > 0) {
    for (const req of opts.requires) {
      lines.push(`import { ${req} } from './${req}';`);
    }
  }
  lines.push("import { expect } from '@playwright/test';");

  lines.push('');

  // Outcome interface
  lines.push(`export interface ${outcomeName} {`);
  lines.push('  // TODO: Define outcome data');
  lines.push('}');
  lines.push('');

  // defineTest call
  lines.push(`export const ${opts.code.replace(/-/g, '_')} = defineTest<${outcomeName}>({`);
  lines.push(`  code: '${opts.code}',`);

  if (hasParams) {
    const paramEntries = opts.params
      .map((p) => `${p.name}: ${quoteDefault(p.default)}`)
      .join(', ');
    lines.push(`  params: { ${paramEntries} },`);

    if (opts.primaryParams.length > 0) {
      const primaries = opts.primaryParams.map((p) => `'${p}'`).join(', ');
      lines.push(`  primaryParams: [${primaries}],`);
    }

    if (opts.requires.length > 0) {
      lines.push(`  requires: () => [${opts.requires.join(', ')}],`);
    }

    lines.push('');
    lines.push('  fixture: async (context, params) => {');
    lines.push('    // TODO: Implement fixture — set up state via DB queries');
    lines.push(`    return {} as ${outcomeName};`);
    lines.push('  },');
    lines.push('');
    lines.push('  flow: async (page, context, params) => {');
    lines.push('    // TODO: Implement flow — browser interactions');
    lines.push('  },');
  } else {
    if (opts.requires.length > 0) {
      lines.push(`  requires: [${opts.requires.join(', ')}],`);
    }

    lines.push('');
    lines.push('  fixture: async (context) => {');
    lines.push('    // TODO: Implement fixture — set up state via DB queries');
    lines.push(`    return {} as ${outcomeName};`);
    lines.push('  },');
    lines.push('');
    lines.push('  flow: async (page, context) => {');
    lines.push('    // TODO: Implement flow — browser interactions');
    lines.push('  },');
  }

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
  console.log(`Created test definition: ${path.relative(process.cwd(), outputPath)}`);
}

main().catch((err) => {
  console.error('Failed to scaffold test:', err);
  process.exit(1);
});
