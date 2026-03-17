/**
 * Shared helper for CLI scripts.
 *
 * Imports the screenwriter config file (triggering createPlaywrightConfig()),
 * then returns the resolved config for scripts to use.
 *
 * Supports --config <path> to override the default location.
 */

import * as path from 'node:path';
import { getResolvedConfig, type ResolvedScreenwriterConfig } from '../src/config';

export async function loadConfig(): Promise<ResolvedScreenwriterConfig> {
  const args = process.argv.slice(2);
  const idx = args.indexOf('--config');
  const configPath = (idx !== -1 && args[idx + 1])
    ? path.resolve(args[idx + 1])
    : path.join(process.cwd(), 'screenwriter.config.ts');

  await import(configPath);
  return getResolvedConfig();
}
