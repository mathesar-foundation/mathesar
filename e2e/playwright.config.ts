import { defineConfig, devices } from '@playwright/test';

import { env } from './support/env';
import { ADMIN_STORAGE_STATE } from './support/auth';

const isCi = Boolean(process.env.CI);

/** Screenshots depend on the fonts of the machine. The runner image sets this. */
const runsVisualTests = Boolean(process.env.E2E_VISUAL_TESTS);

/** Firefox and WebKit run only on request, for major changes such as a framework upgrade. */
const runsAllBrowsers = Boolean(process.env.E2E_ALL_BROWSERS);

const signedIn = {
  viewport: { width: 1440, height: 900 },
  storageState: ADMIN_STORAGE_STATE,
};

// Each browser has its own clipboard permissions. Firefox needs none.
const signedInChrome = {
  ...devices['Desktop Chrome'],
  ...signedIn,
  permissions: ['clipboard-read', 'clipboard-write'],
};

export default defineConfig({
  testDir: './tests',
  outputDir: './test-results',
  fullyParallel: true,
  forbidOnly: isCi,
  retries: isCi ? 1 : 0,
  reporter: isCi
    ? [['github'], ['list'], ['html', { open: 'never' }]]
    : [['list'], ['html', { open: 'never' }]],
  timeout: 60_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: env.baseUrl,
    locale: 'en-US',
    timezoneId: 'UTC',
    viewport: { width: 1440, height: 900 },
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'setup',
      testMatch: /setup\/.*\.setup\.ts/,
      teardown: 'teardown',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'teardown',
      testMatch: /setup\/.*\.teardown\.ts/,
    },
    {
      name: 'chromium',
      testIgnore: /visual\//,
      dependencies: ['setup'],
      use: signedInChrome,
    },
    ...(runsAllBrowsers
      ? [
          {
            name: 'firefox',
            testIgnore: /visual\//,
            dependencies: ['setup'],
            use: { ...devices['Desktop Firefox'], ...signedIn },
          },
          {
            name: 'webkit',
            testIgnore: /visual\//,
            dependencies: ['setup'],
            use: {
              ...devices['Desktop Safari'],
              ...signedIn,
              permissions: ['clipboard-read'],
            },
          },
        ]
      : []),
    ...(runsVisualTests
      ? [
          {
            name: 'visual',
            testMatch: /visual\/.*\.spec\.ts/,
            dependencies: ['setup'],
            use: signedInChrome,
            // The default threshold misses faint colors, such as the background
            // of selected cells. A few edge pixels differ between runs.
            expect: {
              toHaveScreenshot: { threshold: 0.01, maxDiffPixels: 20 },
            },
          },
        ]
      : []),
  ],
});
