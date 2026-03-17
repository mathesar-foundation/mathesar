import * as path from 'node:path';
import {
  defineConfig as playwrightDefineConfig,
  type PlaywrightTestConfig,
} from '@playwright/test';

export interface ScreenwriterConfig {
  /** Absolute path to the directory containing test definition files */
  testsDir: string;
  /** Absolute path to the directory for auto-generated runner files */
  generatedDir?: string;
  /** Base URL for the application under test */
  baseURL: string;
  /** Playwright-specific configuration (testDir and globalSetup are managed by the framework) */
  playwright?: Omit<PlaywrightTestConfig, 'testDir' | 'globalSetup'>;
}

export interface ResolvedScreenwriterConfig {
  testsDir: string;
  generatedDir: string;
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
  return getResolvedConfig().baseURL;
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
  const { testsDir, generatedDir: generatedDirOpt, playwright } = config;
  const generatedDir = generatedDirOpt ?? path.join(process.cwd(), '.generated');

  _resolved = { testsDir, generatedDir, frameworkSrcDir: __dirname, baseURL: config.baseURL };

  return playwrightDefineConfig({
    ...playwright,
    testDir: generatedDir,
    globalSetup: require.resolve('./engine/global-setup'),
    use: {
      ...(playwright?.use ?? {}),
      baseURL: config.baseURL,
    },
  });
}
