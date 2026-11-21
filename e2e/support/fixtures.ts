import {
  type BrowserContext,
  type Page,
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
import { LoginPage } from './ui/pages/login-page';

/** A standard user who reaches `database` through a role that has no privileges yet. */
export interface Collaborator {
  user: User;
  role: StoredRole;
}

interface WorkerFixtures {
  /** The API, called as the admin user. */
  api: MathesarApi;
}

interface TestOptions {
  /** Uncaught browser errors that a test expects, for behaviour that is broken today. */
  allowedUncaughtErrors: RegExp[];
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
}

/** Keeps the app off GitHub and records exceptions that it throws and nothing catches. */
async function guardBrowserContext(
  context: BrowserContext,
  uncaughtErrors: string[],
): Promise<void> {
  await stubGitHubReleases(context);
  context.on('weberror', (webError) => {
    uncaughtErrors.push(webError.error().stack ?? webError.error().message);
  });
}

function unexpectedErrors(errors: string[], allowed: RegExp[]): string[] {
  return errors.filter((error) => !allowed.some((regex) => regex.test(error)));
}

export const test = base.extend<TestOptions & TestFixtures, WorkerFixtures>({
  allowedUncaughtErrors: [[], { option: true }],

  api: [
    async ({}, use) => {
      const api = await MathesarApi.asAdmin();
      await use(api);
      await api.dispose();
    },
    { scope: 'worker' },
  ],

  database: async ({ api }, use) => {
    const database = await api.createDatabase();
    await use(database);
    await api.dropDatabase(database);
  },

  schema: async ({ api, database }, use) => {
    await use(await api.createSchema(database));
  },

  createUser: async ({ api }, use) => {
    const users: User[] = [];
    await use(async (newUser) => {
      const user = await api.createUser(newUser);
      users.push(user);
      return user;
    });
    for (const user of users) await api.deleteUser(user);
  },

  collaborator: async ({ api, database, createUser }, use) => {
    const user = await createUser();
    const role = await api.createStoredRole(database);
    await api.addCollaborator(database, user, role);
    await use({ user, role });
    await api.dropStoredRole(database, role);
  },

  signInAs: async ({ browser, allowedUncaughtErrors }, use) => {
    const contexts: BrowserContext[] = [];
    const uncaughtErrors: string[] = [];
    await use(async (credentials) => {
      const context = await browser.newContext();
      contexts.push(context);
      await guardBrowserContext(context, uncaughtErrors);
      const page = await context.newPage();
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      await loginPage.logIn(credentials);
      return page;
    });
    for (const context of contexts) await context.close();
    expect(
      unexpectedErrors(uncaughtErrors, allowedUncaughtErrors),
      'the app threw uncaught errors',
    ).toEqual([]);
  },

  browserContextGuard: [
    async ({ context, allowedUncaughtErrors }, use) => {
      const uncaughtErrors: string[] = [];
      await guardBrowserContext(context, uncaughtErrors);
      await use();
      expect(
        unexpectedErrors(uncaughtErrors, allowedUncaughtErrors),
        'the app threw uncaught errors',
      ).toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };
