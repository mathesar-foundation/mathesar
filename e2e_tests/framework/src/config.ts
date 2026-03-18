import * as path from 'node:path';
import {
  defineConfig as playwrightDefineConfig,
  type PlaywrightTestConfig,
} from '@playwright/test';

export interface ScreenwriterConfig {
  /** Absolute path to the directory containing test definition files */
  testsDir: string;
  /** Absolute path to the root output directory (default: .output/) */
  outputDir?: string;
  /** Base URL for the application under test */
  baseURL: string;
  /**
   * Playwright-specific configuration.
   * testDir, globalSetup, and projects are managed by the framework.
   * Projects are auto-generated from the DAG with level-based dependencies.
   */
  playwright?: Omit<PlaywrightTestConfig, 'testDir' | 'globalSetup' | 'projects'>;
}

export interface ResolvedScreenwriterConfig {
  testsDir: string;
  outputDir: string;
  runnersDir: string;
  frameworkSrcDir: string;
  baseURL: string;
}

let _resolved: ResolvedScreenwriterConfig | undefined;

/**
 * Returns the resolved config after createPlaywrightConfig() has been called.
 */
export function getResolvedConfig(): ResolvedScreenwriterConfig {
  if (!_resolved) {
    throw new Error(
      'getResolvedConfig() called before createPlaywrightConfig(). ' +
      'Import the screenwriter.config.ts file first.',
    );
  }
  return _resolved;
}

/**
 * Returns the resolved base URL for the application under test.
 */
export function getBaseURL(): string {
  if (_resolved) return _resolved.baseURL;
  if (process.env.SCREENWRITER_BASE_URL) return process.env.SCREENWRITER_BASE_URL;
  throw new Error(
    'getBaseURL() called but no config is available. ' +
    'Either import screenwriter.config.ts or set SCREENWRITER_BASE_URL env var.',
  );
}

export function toRelativePosix(from: string, to: string): string {
  return path.relative(from, to).split(path.sep).join('/');
}

/**
 * Create a Playwright config from a Screenwriter config.
 *
 * Resolves paths, stores the resolved config (for getBaseURL() etc.),
 * and returns a ready-to-use Playwright config object.
 *
 * Runner generation and DAG validation are handled by the wrapper script,
 * not here.
 */
export function createPlaywrightConfig(config: ScreenwriterConfig): PlaywrightTestConfig {
  const { testsDir, outputDir: outputDirOpt, playwright } = config;
  const outputDir = outputDirOpt ?? path.join(process.cwd(), '.output');
  const runnersDir = path.join(outputDir, 'runners');

  _resolved = { testsDir, outputDir, runnersDir, frameworkSrcDir: __dirname, baseURL: config.baseURL };

  return playwrightDefineConfig({
    ...playwright,
    testDir: runnersDir,
    globalSetup: require.resolve('./engine/global-setup'),
    use: {
      ...(playwright?.use ?? {}),
      baseURL: config.baseURL,
    },
  });
}
