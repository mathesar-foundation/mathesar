import {
  type BrowserContext,
  type Page,
  type TestDetails,
  test as base,
  expect,
} from '@playwright/test';

import {
  type Database,
  MathesarApi,
  type NewUser,
  type Schema,
  type StoredRole,
  type User,
} from './api/mathesar';
import type { Credentials } from './api/rpc';
import { stubGitHubReleases } from './github-releases';
import { AppShell } from './ui/pages/app-shell';
import { LoginPage } from './ui/pages/login-page';

/** A standard user who reaches `database` through a role that has no privileges yet. */
export interface Collaborator {
  user: User;
  role: StoredRole;
}

/**
 * Details for a test that deletes what the pages of other tests load, such as
 * a server record or a role. Playwright runs it while no other test runs.
 */
export const runsAlone: TestDetails = { lock: '-exclusive-' };

type Cleanup = (api: MathesarApi) => Promise<void>;

interface WorkerFixtures {
  /** The API, called as the admin user. */
  api: MathesarApi;
  /** Deletions of test data, run once every page of the test has closed. */
  pendingCleanups: Cleanup[];
}

interface TestOptions {
  /**
   * Browser errors that the test expects: a known bug or a failure it causes.
   * One expression: `test.use` reads an array of two as a value and options.
   */
  allowedBrowserErrors: RegExp | undefined;
}

interface TestFixtures {
  /** An empty database that only this test uses. */
  database: Database;
  /** An empty schema in `database`. */
  schema: Schema;
  /** Creates a Mathesar user that is deleted after the test. */
  createUser: (newUser?: NewUser) => Promise<User>;
  /** Adds a new standard user to `database` with a new role. Grant the role what the test needs. */
  collaborator: Collaborator;
  /** Opens a page in a separate browser session, signed in through the login form. */
  signInAs: (credentials: Credentials) => Promise<Page>;
  browserContextGuard: void;
  cleanupsOfPreviousTest: void;
}

/**
 * How Chromium and Firefox log a failed request. Tests make some fail on purpose.
 * Firefox logs only a request to another origin.
 */
const failedRequestLog =
  /^Failed to load resource|\(Reason: CORS request did not succeed\)/;

/**
 * Keeps the app off GitHub and records the exceptions that it throws and
 * nothing catches, and the errors that it logs with `console.error`.
 */
export async function guardBrowserContext(
  context: BrowserContext,
  browserErrors: string[],
): Promise<void> {
  await stubGitHubReleases(context);
  context.on('weberror', (webError) => {
    const error = webError.error();
    // WebKit gives a rejected promise an empty stack.
    browserErrors.push(error.stack || error.message);
  });
  context.on('console', (message) => {
    if (message.type() === 'error' && !failedRequestLog.test(message.text())) {
      browserErrors.push(message.text());
    }
  });
}

/**
 * Data deleted while a page of the test still runs makes that page throw, so
 * the fixtures defer deletions until the next test starts or the worker ends.
 */
async function runCleanups(
  cleanups: Cleanup[],
  api: MathesarApi,
): Promise<string[]> {
  const failures: string[] = [];
  for (const cleanup of cleanups.splice(0)) {
    await cleanup(api).catch((error: unknown) => failures.push(String(error)));
  }
  return failures;
}

export function unexpectedErrors(
  errors: string[],
  allowed: RegExp | undefined,
): string[] {
  return errors.filter((error) => !allowed?.test(error));
}

export const test = base.extend<TestOptions & TestFixtures, WorkerFixtures>({
  allowedBrowserErrors: [undefined, { option: true }],

  api: [
    async ({}, use) => {
      const api = await MathesarApi.asAdmin();
      await use(api);
      await api.dispose();
    },
    { scope: 'worker' },
  ],

  pendingCleanups: [
    async ({ api }, use) => {
      const cleanups: Cleanup[] = [];
      await use(cleanups);
      for (const failure of await runCleanups(cleanups, api)) {
        console.warn(`Cleanup of test data failed: ${failure}`);
      }
    },
    { scope: 'worker' },
  ],

  cleanupsOfPreviousTest: [
    async ({ api, pendingCleanups }, use, testInfo) => {
      for (const failure of await runCleanups(pendingCleanups, api)) {
        testInfo.annotations.push({
          type: 'cleanup of the previous test failed',
          description: failure,
        });
      }
      await use();
    },
    { auto: true },
  ],

  database: async ({ api, pendingCleanups }, use) => {
    const database = await api.createDatabase();
    await use(database);
    pendingCleanups.push((admin) => admin.dropDatabase(database));
  },

  schema: async ({ api, database }, use) => {
    await use(await api.createSchema(database));
  },

  createUser: async ({ api, pendingCleanups }, use) => {
    const users: User[] = [];
    await use(async (newUser) => {
      const user = await api.createUser(newUser);
      users.push(user);
      return user;
    });
    for (const user of users) {
      pendingCleanups.push((admin) => admin.deleteUser(user));
    }
  },

  collaborator: async ({ api, database, createUser }, use) => {
    const user = await createUser();
    const role = await api.createStoredRole(database);
    await api.addCollaborator(database, user, role);
    await use({ user, role });
  },

  signInAs: async ({ browser, allowedBrowserErrors }, use) => {
    const contexts: BrowserContext[] = [];
    const browserErrors: string[] = [];
    await use(async (credentials) => {
      // Without this, the new context would start with the admin's session.
      const context = await browser.newContext({
        storageState: { cookies: [], origins: [] },
      });
      contexts.push(context);
      await guardBrowserContext(context, browserErrors);
      const page = await context.newPage();
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      await loginPage.logIn(credentials);
      // WebKit can drop a login that the next navigation interrupts. Firefox and
      // WebKit report the loads that it cuts short, such as the dictionary of the app.
      await expect(page).not.toHaveURL(/\/auth\/login\//);
      await expect(new AppShell(page).headers).toBeVisible();
      return page;
    });
    for (const context of contexts) await context.close();
    expect(
      unexpectedErrors(browserErrors, allowedBrowserErrors),
      'the app threw or logged errors',
    ).toEqual([]);
  },

  browserContextGuard: [
    async ({ context, allowedBrowserErrors }, use) => {
      const browserErrors: string[] = [];
      await guardBrowserContext(context, browserErrors);
      await use();
      expect(
        unexpectedErrors(browserErrors, allowedBrowserErrors),
        'the app threw or logged errors',
      ).toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };
