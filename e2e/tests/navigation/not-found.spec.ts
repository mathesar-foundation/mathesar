import type { Page } from '@playwright/test';

import { pinsKnownBug } from '../../support/known-bugs';
import { AdminNavigation } from '../../support/ui/components/admin-navigation';
import { Breadcrumb } from '../../support/ui/components/breadcrumb';
import { AppShell } from '../../support/ui/pages/app-shell';
import { explorationUrl } from '../../support/ui/pages/data-explorer-page';
import { DatabaseLayout } from '../../support/ui/pages/database-layout';
import { ErrorPage } from '../../support/ui/pages/error-page';
import { formBuilderUrl } from '../../support/ui/pages/form-builder-page';
import { recordUrl, schemaUrl } from '../../support/ui/urls';
import { type Library, expect, test } from './fixtures';

const UNKNOWN_ID = 999999;
const PAGE_DOES_NOT_EXIST = "The page you're looking for doesn't exist.";

/** The error pages set no title of their own and keep the one that the server sends. */
const SERVER_TITLE = 'Mathesar - Home';

async function expectErrorPage(page: Page, message: string): Promise<void> {
  await expect(new ErrorPage(page).heading).toBeVisible();
  await expect(new AppShell(page).content).toContainText(message);
}

test('an unknown address shows the error page in the app under the status 404', async ({
  page,
}) => {
  const response = await page.goto('/nothing/');

  expect(response?.status()).toBe(404);
  await expectErrorPage(page, PAGE_DOES_NOT_EXIST);
  await expect(new ErrorPage(page).homeLink).toHaveAttribute('href', '/');
  await expect(new AppShell(page).headers).toHaveCount(1);
  await expect(new Breadcrumb(page).items).toHaveCount(0);
  await expect(page).toHaveTitle(SERVER_TITLE);
});

test.describe('logged-out visitor', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('sees the error page without the app header at an unknown address', async ({
    page,
  }) => {
    const response = await page.goto('/nothing/');

    expect(response?.status()).toBe(404);
    await expectErrorPage(page, PAGE_DOES_NOT_EXIST);
    await expect(new AppShell(page).headers).toHaveCount(0);
  });
});

test.describe('the page of something that does not exist', () => {
  const unknowns: {
    what: string;
    url: (library: Library) => string;
    message: string;
    /** The levels after the database. */
    trail: string[];
    title?: string;
  }[] = [
    {
      what: 'a schema',
      url: ({ schema }) => `/db/${schema.database.id}/schemas/${UNKNOWN_ID}/`,
      message: 'Schema not found.',
      trail: [],
    },
    {
      what: 'a table',
      url: ({ schema }) => `${schemaUrl(schema)}tables/${UNKNOWN_ID}/`,
      message: 'Table not found.',
      trail: ['Library'],
    },
    {
      what: 'a record',
      url: ({ books }) => recordUrl(books, UNKNOWN_ID),
      message: `Record with id ${UNKNOWN_ID} not found.`,
      trail: ['Library', 'Books'],
      // The title holds the summary of the record, which is empty.
      title: '| Mathesar',
    },
    {
      what: 'an exploration',
      url: ({ schema }) => explorationUrl(schema, UNKNOWN_ID),
      message: 'Exploration not found.',
      trail: ['Library', 'Data Explorer'],
    },
    {
      what: 'a form',
      url: ({ schema }) => formBuilderUrl(schema, UNKNOWN_ID),
      message: PAGE_DOES_NOT_EXIST,
      trail: ['Library'],
    },
    {
      what: 'a page under a schema',
      url: ({ schema }) => `${schemaUrl(schema)}nothing/`,
      message: PAGE_DOES_NOT_EXIST,
      trail: ['Library'],
    },
  ];

  for (const { what, url, message, trail, title } of unknowns) {
    test(`says that ${what} is unknown, under the trail of what exists`, async ({
      page,
      database,
      library,
    }) => {
      const response = await page.goto(url(library));

      expect(response?.status()).toBe(200);
      await expectErrorPage(page, message);
      await expect(new Breadcrumb(page).items).toHaveText([
        database.name,
        ...trail,
      ]);
      await expect(page).toHaveTitle(title ?? SERVER_TITLE);
    });
  }

  test('says that a database is unknown, with an empty trail', async ({
    page,
  }) => {
    const response = await page.goto(`/db/${UNKNOWN_ID}/`);

    expect(response?.status()).toBe(200);
    await expectErrorPage(page, `Database with id ${UNKNOWN_ID} is not found.`);
    await expect(new Breadcrumb(page).items).toHaveCount(0);
    await expect(page).toHaveTitle(SERVER_TITLE);
  });

  test('calls a database id that is not a number NaN, under the status 404', async ({
    page,
  }) => {
    const response = await page.goto('/db/abc/');

    expect(response?.status()).toBe(404);
    await expectErrorPage(page, 'Database with id NaN is not found.');
  });
});

test.describe('an unknown page under a database or the administration', () => {
  test(
    'shows the page above it and the error page in a second app frame',
    pinsKnownBug('unknown-path-renders-two-pages'),
    async ({ page, database }) => {
      const shell = new AppShell(page);
      const errorPage = new ErrorPage(page);
      const breadcrumb = new Breadcrumb(page);

      const databaseResponse = await page.goto(`/db/${database.id}/nothing/`);
      expect(databaseResponse?.status()).toBe(200);
      await expect(new DatabaseLayout(page).schemasTab).toBeVisible();
      await expect(errorPage.message).toBeVisible();
      await expect(shell.headers).toHaveCount(2);
      await expect(breadcrumb.items).toHaveText([database.name, database.name]);

      const adminResponse = await page.goto('/administration/nothing/');
      expect(adminResponse?.status()).toBe(404);
      await expect(new AdminNavigation(page).item('Users')).toBeVisible();
      await expect(errorPage.message).toBeVisible();
      await expect(shell.headers).toHaveCount(2);
    },
  );

  test.fixme('shows only the error page', async ({ page, database }) => {
    const shell = new AppShell(page);
    const errorPage = new ErrorPage(page);

    await page.goto(`/db/${database.id}/nothing/`);
    await expect(errorPage.message).toBeVisible();
    await expect(shell.headers).toHaveCount(1);
    await expect(new DatabaseLayout(page).schemasTab).toHaveCount(0);

    await page.goto('/administration/nothing/');
    await expect(errorPage.message).toBeVisible();
    await expect(shell.headers).toHaveCount(1);
    await expect(new AdminNavigation(page).item('Users')).toHaveCount(0);
  });
});
