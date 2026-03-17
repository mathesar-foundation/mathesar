import * as path from 'node:path';
import { devices } from '@playwright/test';
import { createPlaywrightConfig } from './framework/src';
import type { ScreenwriterConfig } from './framework/src';

export const screenwriterConfig: ScreenwriterConfig = {
  testsDir: path.join(__dirname, 'mathesar', 'tests'),
  baseURL: process.env.BASE_URL || 'http://e2e-service:8000',

  playwright: {
    fullyParallel: false,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: 1,
    reporter: [
      ['html', { open: 'never', outputFolder: 'playwright-report' }],
      ['list'],
    ],
    outputDir: 'test-results',
    use: {
      trace: 'on-first-retry',
      screenshot: 'only-on-failure',
      video: 'retain-on-failure',
    },
    projects: [
      {
        name: 'chromium',
        use: { ...devices['Desktop Chrome'] },
      },
      // Uncomment to enable multi-browser testing:
      // {
      //   name: 'firefox',
      //   use: { ...devices['Desktop Firefox'] },
      // },
      // {
      //   name: 'webkit',
      //   use: { ...devices['Desktop Safari'] },
      // },
    ],
  },
};

export default createPlaywrightConfig(screenwriterConfig);
