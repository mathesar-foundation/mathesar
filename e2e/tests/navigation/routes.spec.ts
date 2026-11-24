import type { Page } from '@playwright/test';

import { holdRpcCalls } from '../../support/held-requests';
import { Breadcrumb } from '../../support/ui/components/breadcrumb';
import { AppShell } from '../../support/ui/pages/app-shell';
import {
  dataExplorerUrl,
  explorationUrl,
} from '../../support/ui/pages/data-explorer-page';
import {
  DatabaseSettingsPage,
  sectionUrl,
} from '../../support/ui/pages/database-settings-page';
import { formBuilderUrl } from '../../support/ui/pages/form-builder-page';
import {
  PublicFormPage,
  publicFormUrl,
} from '../../support/ui/pages/public-form-page';
import {
  databaseUrl,
  recordUrl,
  schemaUrl,
  tableUrl,
} from '../../support/ui/urls';
import { type Library, expect, test } from './fixtures';

interface PageFacts {
  /** Left out for the profile page, whose title `tests/users/profile.spec.ts` pins as a bug. */
  title?: string;
  /** The names of the levels in the header, after the logo. */
  breadcrumb: string[];
  /** A text below the header that only this page has. */
  shows: string;
  /** The name in the band below the header, on the pages that have one. */
  header?: string | RegExp;
}

async function expectPage(page: Page, facts: PageFacts): Promise<void> {
  const shell = new AppShell(page);
  await expect(shell.content).toContainText(facts.shows);
  await expect(shell.spinners).toHaveCount(0);
  await expect(shell.headers).toHaveCount(1);
  await expect(new Breadcrumb(page).items).toHaveText(facts.breadcrumb);
  if (facts.header) {
    await expect(shell.secondaryHeader).toContainText(facts.header);
  }
  if (facts.title) await expect(page).toHaveTitle(facts.title);
  await shell.expectNoMissingValueAsText();
}

/** Opens the page as a bookmark would and loads it a second time. */
async function expectDeepLink(
  page: Page,
  url: string,
  facts: PageFacts,
): Promise<void> {
  await page.goto(url);
  await expectPage(page, facts);
  await page.reload();
  await expectPage(page, facts);
}

test.describe('pages outside a database, by URL', () => {
  const administration = 'Administration';
  const routes: ({ name: string; url: string } & PageFacts)[] = [
    {
      name: 'the home page',
      url: '/',
      title: 'Databases | Mathesar',
      breadcrumb: [],
      shows: 'Databases',
      header: /Welcome to Mathesar, /,
    },
    {
      name: 'the profile page',
      url: '/profile/',
      breadcrumb: ['User Profile'],
      shows: 'Account Details',
    },
    {
      name: 'the software update page',
      url: '/administration/update/',
      title: 'Software Update | Mathesar',
      breadcrumb: [administration, 'Software Update'],
      shows: 'Check for Updates',
      header: administration,
    },
    {
      name: 'the list of users',
      url: '/administration/users/',
      title: 'Users | Mathesar',
      breadcrumb: [administration, 'Users'],
      shows: 'Add User',
      header: administration,
    },
    {
      name: 'the new user page under the title of the server',
      url: '/administration/users/new/',
      title: 'Mathesar - Home',
      breadcrumb: [administration, 'Users', 'New User'],
      shows: 'New User',
      header: administration,
    },
    {
      name: 'the administration settings',
      url: '/administration/settings/',
      title: 'Settings | Mathesar',
      breadcrumb: [administration, 'Settings'],
      shows: 'Enable anonymous usage data collection',
      header: administration,
    },
  ];

  for (const { name, url, ...facts } of routes) {
    test(`opens ${name} and loads it again`, async ({ page }) => {
      await expectDeepLink(page, url, facts);
    });
  }

  test('opens the page of a user under the title of the server and loads it again', async ({
    page,
    createUser,
  }) => {
    const user = await createUser();
    await expectDeepLink(page, `/administration/users/${user.id}/`, {
      title: 'Mathesar - Home',
      breadcrumb: [administration, 'Users', user.username],
      shows: `Edit User: ${user.username}`,
      header: administration,
    });
  });
});

test.describe('pages of a database, by URL', () => {
  test('opens the schemas of a database and loads them again', async ({
    page,
    database,
  }) => {
    await expectDeepLink(page, databaseUrl(database), {
      title: `${database.name} | Mathesar`,
      breadcrumb: [database.name],
      shows: 'Create Schema',
      header: database.name,
    });
  });

  for (const section of ['Roles', 'Stored Roles', 'Collaborators'] as const) {
    test(`opens the settings section "${section}" and loads it again`, async ({
      page,
      database,
    }) => {
      const settings = new DatabaseSettingsPage(page);
      const facts = {
        title: `${database.name} | Mathesar`,
        breadcrumb: [database.name],
        shows: 'In PostgreSQL',
        header: database.name,
      };
      await page.goto(sectionUrl(database, section));
      await expect(settings.heading).toHaveText(section);
      await expectPage(page, facts);

      await page.reload();
      await expect(settings.heading).toHaveText(section);
      await expectPage(page, facts);
    });
  }
});

test.describe('pages of a schema, by URL', () => {
  const routes: ({
    name: string;
    url: (library: Library) => string;
  } & PageFacts)[] = [
    {
      name: 'a schema',
      url: ({ schema }) => schemaUrl(schema),
      title: 'Library | Mathesar',
      breadcrumb: [],
      shows: 'New Table',
      header: 'Library',
    },
    {
      name: 'a table',
      url: ({ books }) => tableUrl(books),
      title: 'Books | Mathesar',
      breadcrumb: ['Books'],
      shows: 'Showing 1–3 of 3',
    },
    {
      name: 'a view',
      url: ({ longBooks }) => tableUrl(longBooks),
      title: 'Long Books | Mathesar',
      breadcrumb: ['Long Books'],
      shows: 'Showing 1–2 of 2',
    },
    {
      name: 'a record under the name of its summary',
      url: ({ books }) => recordUrl(books, 1),
      title: 'Dune | Mathesar',
      breadcrumb: ['Books', 'Dune'],
      shows: 'Record in Books',
    },
    {
      name: 'the import page',
      url: ({ schema }) => `${schemaUrl(schema)}import/`,
      title: 'Import | Mathesar',
      breadcrumb: ['Import'],
      shows: 'Create a table by importing your data',
    },
    {
      name: 'the Data Explorer',
      url: ({ schema }) => dataExplorerUrl(schema),
      title: 'Data Explorer | Mathesar',
      breadcrumb: ['Data Explorer'],
      shows: 'Get started by selecting a table and adding columns',
    },
  ];

  for (const { name, url, breadcrumb, ...facts } of routes) {
    test(`opens ${name} and loads it again`, async ({
      page,
      database,
      library,
    }) => {
      await expectDeepLink(page, url(library), {
        ...facts,
        breadcrumb: [database.name, 'Library', ...breadcrumb],
      });
    });
  }

  test('opens a saved exploration and loads it again', async ({
    page,
    database,
    library,
    titles,
  }) => {
    await expectDeepLink(page, explorationUrl(library.schema, titles.id), {
      title: `${titles.name} | Mathesar`,
      breadcrumb: [database.name, 'Library', titles.name],
      shows: 'Ulysses',
    });
  });

  test('opens the editor of a form and loads it again', async ({
    page,
    database,
    library,
    bookForm,
  }) => {
    await expectDeepLink(page, formBuilderUrl(library.schema, bookForm.id), {
      title: 'Book form | Mathesar',
      breadcrumb: [database.name, 'Library', 'Book form'],
      shows: 'Add fields',
    });
  });

  test('shows the header and a spinner while the forms of the schema load', async ({
    page,
    database,
    library,
    bookForm,
  }) => {
    const shell = new AppShell(page);
    const breadcrumb = new Breadcrumb(page);
    const releaseForms = await holdRpcCalls(page, 'forms.list');
    await page.goto(formBuilderUrl(library.schema, bookForm.id));
    await expect(shell.loadingPage).toBeVisible();
    await expect(shell.spinners).toHaveCount(1);
    await expect(breadcrumb.items).toHaveText([database.name, 'Library']);

    releaseForms();
    await expect(shell.content).toContainText('Add fields');
    await expect(shell.loadingPage).toHaveCount(0);
    await expect(shell.spinners).toHaveCount(0);
    await expect(breadcrumb.items).toHaveText([
      database.name,
      'Library',
      'Book form',
    ]);
  });

  test('opens the public page of a form, which has no app header, and loads it again', async ({
    page,
    api,
    library,
    bookForm,
  }) => {
    await api.publishForm(library.schema, bookForm);
    const publicForm = new PublicFormPage(page);
    await page.goto(publicFormUrl(bookForm.token));
    await expect(publicForm.heading).toHaveText('Book form');

    await page.reload();
    await expect(publicForm.heading).toHaveText('Book form');
    await expect(page).toHaveTitle('Book form | Mathesar');
    await expect(new AppShell(page).headers).toHaveCount(0);
  });

  test('opens a schema and a table whose URL lacks the last slash', async ({
    page,
    library,
  }) => {
    const shell = new AppShell(page);
    const schemaWithoutSlash = schemaUrl(library.schema).slice(0, -1);
    await page.goto(schemaWithoutSlash);
    await expect(shell.content).toContainText('New Table');
    await expect(page).toHaveURL(schemaWithoutSlash);

    const tableWithoutSlash = tableUrl(library.books).slice(0, -1);
    await page.goto(tableWithoutSlash);
    await expect(shell.content).toContainText('Showing 1–3 of 3');
    await expect(page).toHaveURL(tableWithoutSlash);
  });
});

test.describe('redirects', () => {
  test('sends the URL of a database to its schemas', async ({
    page,
    database,
  }) => {
    await page.goto(`/db/${database.id}/`);
    await expect(page).toHaveURL(databaseUrl(database));
    await expect(new AppShell(page).content).toContainText('Create Schema');
  });

  test('sends the database settings to the roles', async ({
    page,
    database,
  }) => {
    await page.goto(`/db/${database.id}/settings/`);
    await expect(page).toHaveURL(sectionUrl(database, 'Roles'));
    await expect(new DatabaseSettingsPage(page).heading).toHaveText('Roles');
  });

  test('sends the administration to the software update page', async ({
    page,
  }) => {
    await page.goto('/administration/');
    await expect(page).toHaveURL('/administration/update/');
    await expect(new AppShell(page).content).toContainText('Check for Updates');
  });

  test('sends the former edit URL of an exploration to the exploration', async ({
    page,
    library,
    titles,
  }) => {
    const url = explorationUrl(library.schema, titles.id);
    await page.goto(`${url}edit`);
    await expect(page).toHaveURL(url);
    await expect(new AppShell(page).content).toContainText('Ulysses');
  });

  test('adds the last slash to the URL of the profile page', async ({
    page,
  }) => {
    await page.goto('/profile');
    await expect(page).toHaveURL('/profile/');
    await expect(new AppShell(page).content).toContainText('Account Details');
  });
});
