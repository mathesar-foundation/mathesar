import { uniqueName } from '../../support/api/mathesar';
import { runSql } from '../../support/api/postgres';
import { pinsKnownBug } from '../../support/known-bugs';
import { ABORTED_RECORDS_REQUEST } from '../../support/page-errors';
import { recordRpcCalls } from '../../support/rpc-log';
import {
  Breadcrumb,
  type BreadcrumbSelector,
} from '../../support/ui/components/breadcrumb';
import { expectStaysOpen } from '../../support/ui/components/transitions';
import { AppShell } from '../../support/ui/pages/app-shell';
import {
  dataExplorerUrl,
  explorationUrl,
} from '../../support/ui/pages/data-explorer-page';
import { formBuilderUrl } from '../../support/ui/pages/form-builder-page';
import { TablePage } from '../../support/ui/pages/table-page';
import {
  databaseUrl,
  recordUrl,
  schemaUrl,
  tableUrl,
} from '../../support/ui/urls';
import { expect, test } from './fixtures';

test.describe('database selector of the breadcrumb', () => {
  let selector: BreadcrumbSelector;

  test.beforeEach(({ page }) => {
    selector = new Breadcrumb(page).databases;
  });

  test('finds a database by its name and opens it', async ({
    page,
    database,
  }) => {
    await page.goto('/');
    await selector.open();
    await expect(selector.entry(database.name)).toBeVisible();
    await expect(selector.currentEntries).toHaveCount(0);

    await selector.search.fill(database.name);
    await expect(selector.entries).toHaveText([database.name]);
    await expect(selector.section('Databases')).toContainText(
      `1 match for ${database.name}`,
    );

    await selector.entry(database.name).click();
    await expect(page).toHaveURL(databaseUrl(database));
    await expect(selector.panel).toBeHidden();
    await expect(new AppShell(page).content).toContainText('Create Schema');
  });

  test('marks the database that is open', async ({ page, database }) => {
    await page.goto(databaseUrl(database));
    await selector.open();

    await expect(selector.currentEntries).toHaveText([database.name]);
  });

  test('finds a database by its nickname but not by its name', async ({
    page,
    api,
    database,
  }) => {
    const nickname = uniqueName('Stock room');
    await api.setNickname(database, nickname);
    await page.goto('/');
    await selector.open();

    await selector.search.fill(nickname);
    await expect(selector.entries).toHaveText([nickname]);
    await selector.search.fill(database.name);
    await expect(selector.section('Databases')).toContainText(
      `No matches for ${database.name}`,
    );
  });
});

test.describe('schema selector of the breadcrumb', () => {
  let selector: BreadcrumbSelector;

  test.beforeEach(({ page }) => {
    selector = new Breadcrumb(page).schemas;
  });

  test('lists the schemas of the database, none of them marked on the database page', async ({
    page,
    database,
    library,
    shop,
  }) => {
    await page.goto(databaseUrl(database));
    await selector.open();

    await expect(selector.sectionEntries('Schemas')).toHaveText([
      library.schema.name,
      'public',
      shop.name,
    ]);
    await expect(selector.currentEntries).toHaveCount(0);
  });

  test('marks the schema that is open and opens the one that is chosen', async ({
    page,
    library,
    shop,
  }) => {
    await page.goto(tableUrl(library.books));
    await selector.open();
    await expect(selector.currentEntries).toHaveText(['Library']);

    await selector.entry('Shop').click();
    await expect(page).toHaveURL(schemaUrl(shop));
    await expect(selector.panel).toBeHidden();
    await selector.open();
    await expect(selector.currentEntries).toHaveText(['Shop']);
  });

  test('says that a database has no schemas', async ({ page, database }) => {
    await runSql(database.name, 'DROP SCHEMA public CASCADE');
    await page.goto(databaseUrl(database));
    await selector.open();

    await expect(selector.section('Schemas')).toContainText('No Schemas Found');
    await expect(selector.entries).toHaveCount(0);
  });
});

test.describe('selector for the tables, explorations and forms of a schema', () => {
  let breadcrumb: Breadcrumb;
  let selector: BreadcrumbSelector;

  test.beforeEach(({ page }) => {
    breadcrumb = new Breadcrumb(page);
    selector = breadcrumb.tablesAndExplorations;
  });

  test('lists views before tables, then explorations and forms', async ({
    page,
    library,
    titles,
    bookForm,
  }) => {
    await page.goto(schemaUrl(library.schema));
    await selector.open();

    await expect(selector.sectionEntries('Tables & Views')).toHaveText([
      'Long Books',
      'Authors',
      'Books',
    ]);
    await expect(selector.sectionEntries('Explorations')).toHaveText([
      titles.name,
    ]);
    await expect(selector.sectionEntries('Forms')).toHaveText([bookForm.name]);
    await expect(selector.currentEntries).toHaveCount(0);
  });

  test('says what a schema lacks', async ({ page, shop }) => {
    await page.goto(schemaUrl(shop));
    await selector.open();

    await expect(selector.sectionEntries('Tables')).toHaveText(['Orders']);
    await expect(selector.section('Explorations')).toContainText(
      'No Explorations',
    );
    await expect(selector.section('Forms')).toContainText('No Forms');
  });

  test('says that a schema has no tables', async ({ page, api, database }) => {
    await page.goto(schemaUrl(await api.createSchema(database, 'Empty')));
    await selector.open();

    await expect(selector.section('Tables')).toContainText('No Tables');
    await expect(selector.entries).toHaveCount(0);
  });

  test(
    'lists no forms on a page that was opened by its URL',
    pinsKnownBug('breadcrumb-selector-forms-not-loaded'),
    async ({ page, library, bookForm }) => {
      await page.goto(tableUrl(library.books));
      await selector.open();

      await expect(selector.section('Forms')).toContainText('No Forms');
      await expect(selector.entry(bookForm.name)).toHaveCount(0);
    },
  );

  test.fixme('lists the forms on a page that was opened by its URL', async ({
    page,
    library,
    bookForm,
  }) => {
    await page.goto(tableUrl(library.books));
    await selector.open();

    await expect(selector.sectionEntries('Forms')).toHaveText([bookForm.name]);
  });

  test('marks the table, the exploration or the form that is open', async ({
    page,
    library,
    titles,
    bookForm,
  }) => {
    // A page that loads its data draws the header again once the data is in,
    // and only then shows the level of the trail that names the data.
    await page.goto(recordUrl(library.books, 1));
    await expect(breadcrumb.items.last()).toHaveText('Dune');
    await selector.open();
    await expect(selector.currentEntries).toHaveText(['Books']);

    await page.goto(explorationUrl(library.schema, titles.id));
    await expect(breadcrumb.items.last()).toHaveText(titles.name);
    await selector.open();
    await expect(selector.currentEntries).toHaveText([titles.name]);

    await page.goto(formBuilderUrl(library.schema, bookForm.id));
    await expect(breadcrumb.items.last()).toHaveText(bookForm.name);
    await selector.open();
    await expect(selector.currentEntries).toHaveText([bookForm.name]);
  });

  test('opens below its button with the focus in the search field', async ({
    page,
    library,
  }) => {
    await page.goto(tableUrl(library.books));
    await selector.trigger.click();

    await expect(selector.search).toBeFocused();
    await expect(selector.search).toHaveValue('');
    const button = (await selector.trigger.boundingBox())!;
    await expect
      .poll(async () => (await selector.panel.boundingBox())!.y)
      .toBeGreaterThanOrEqual(button.y + button.height);
    const panel = (await selector.panel.boundingBox())!;
    expect(Math.abs(panel.x - button.x)).toBeLessThan(2);
  });

  test('filters all sections while the user types and counts the matches', async ({
    page,
    library,
    titles,
  }) => {
    await page.goto(tableUrl(library.books));
    await selector.open();
    await page.keyboard.type('ok');

    await expect(selector.sectionEntries('Tables & Views')).toHaveText([
      'Long Books',
      'Books',
    ]);
    await expect(selector.section('Tables & Views')).toContainText(
      '2 matches for ok',
    );
    await expect(selector.matches).toHaveText(['ok', 'ok']);
    await expect(selector.section('Explorations')).toContainText(
      'No matches for ok',
    );

    await selector.search.fill('TITLES');
    await expect(selector.entries).toHaveText([titles.name]);
    await expect(selector.section('Explorations')).toContainText(
      '1 match for TITLES',
    );
    await expect(selector.section('Tables & Views')).toContainText(
      'No matches for TITLES',
    );
  });

  test('forgets the search when it opens again', async ({ page, library }) => {
    await page.goto(tableUrl(library.books));
    await selector.open();
    await selector.search.fill('Auth');
    await expect(selector.entries).toHaveCount(1);
    await page.keyboard.press('Escape');
    await selector.open();

    await expect(selector.search).toHaveValue('');
    await expect(selector.sectionEntries('Tables & Views')).toHaveCount(3);
  });

  test('moves through the entries with the arrow keys, by way of the search field', async ({
    page,
    library,
    titles,
  }) => {
    await page.goto(tableUrl(library.books));
    await selector.open();

    await page.keyboard.press('ArrowDown');
    await expect(selector.entry('Long Books')).toBeFocused();
    await page.keyboard.press('ArrowDown');
    await expect(selector.entry('Authors')).toBeFocused();
    await page.keyboard.press('ArrowUp');
    await page.keyboard.press('ArrowUp');
    await expect(selector.search).toBeFocused();
    await page.keyboard.press('ArrowUp');
    await expect(selector.entry(titles.name)).toBeFocused();
    await page.keyboard.press('ArrowDown');
    await expect(selector.search).toBeFocused();
  });

  test('continues the search when the user types or deletes while an entry has the focus', async ({
    page,
    library,
  }) => {
    await page.goto(tableUrl(library.books));
    await selector.open();
    await page.keyboard.type('o');
    await page.keyboard.press('ArrowDown');
    await expect(selector.entry('Long Books')).toBeFocused();
    await page.keyboard.type('k');

    await expect(selector.search).toBeFocused();
    await expect(selector.search).toHaveValue('ok');
    await expect(selector.entries).toHaveText(['Long Books', 'Books']);

    await page.keyboard.press('ArrowDown');
    await expect(selector.entry('Long Books')).toBeFocused();
    await page.keyboard.press('Backspace');
    await expect(selector.search).toBeFocused();
    await expect(selector.search).toHaveValue('o');
    await expect(selector.entries).toHaveText([
      'Long Books',
      'Authors',
      'Books',
    ]);
  });

  test.describe(() => {
    test.use({ allowedBrowserErrors: ABORTED_RECORDS_REQUEST });

    test('opens the entry that has the focus on Enter and leaves the focus on its button', async ({
      page,
      library,
    }) => {
      const tablePage = new TablePage(page);
      await tablePage.goto(library.books);
      await selector.open();
      await page.keyboard.type('Auth');
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('Enter');

      await expect(page).toHaveURL(tableUrl(library.authors));
      await expect(selector.panel).toBeHidden();
      await expect(tablePage.heading).toHaveText('Authors');
      await expect(selector.trigger).toBeFocused();
    });
  });

  test('closes on Escape and returns the focus to its button', async ({
    page,
    library,
  }) => {
    await page.goto(tableUrl(library.books));
    await selector.open();
    await page.keyboard.press('Escape');

    await expect(selector.panel).toBeHidden();
    await expect(selector.trigger).toBeFocused();
    await expect(page).toHaveURL(tableUrl(library.books));
  });

  test('closes on a second click on its button and on a click elsewhere', async ({
    page,
    library,
  }) => {
    const tablePage = new TablePage(page);
    await tablePage.goto(library.books);
    await selector.open();
    await selector.trigger.click();
    await expect(selector.panel).toBeHidden();

    await selector.open();
    await tablePage.heading.click();
    await expect(selector.panel).toBeHidden();
  });

  test('keeps the Tab key inside while it is open', async ({
    page,
    library,
    titles,
  }) => {
    await page.goto(tableUrl(library.books));
    await selector.open();

    await page.keyboard.press('Shift+Tab');
    await expect(selector.entry(titles.name)).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(selector.search).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(selector.entry('Long Books')).toBeFocused();
    await expectStaysOpen(selector.panel);
  });

  test('opens a saved exploration, which is fetched once', async ({
    page,
    library,
    titles,
  }) => {
    await page.goto(tableUrl(library.books));
    const calls = recordRpcCalls(page);
    await selector.choose(titles.name);

    await expect(page).toHaveURL(explorationUrl(library.schema, titles.id));
    await expect(new AppShell(page).content).toContainText('Ulysses');
    expect(calls.filter((method) => method === 'explorations.get')).toEqual([
      'explorations.get',
    ]);
  });

  test('opens the editor of a form', async ({ page, library, bookForm }) => {
    await page.goto(schemaUrl(library.schema));
    await selector.choose(bookForm.name);

    await expect(page).toHaveURL(formBuilderUrl(library.schema, bookForm.id));
    await expect(new AppShell(page).content).toContainText('Add fields');
  });

  test('leads from the Data Explorer to a table', async ({ page, library }) => {
    await page.goto(dataExplorerUrl(library.schema));
    await selector.choose('Authors');

    await expect(page).toHaveURL(tableUrl(library.authors));
    await expect(new TablePage(page).recordCount).toHaveText(
      'Showing 1–2 of 2',
    );
  });

  test('searches the records of a table from its entry and opens the chosen record', async ({
    page,
    database,
    library,
  }) => {
    const { recordSearch } = breadcrumb;
    await page.goto(tableUrl(library.books));
    await selector.open();
    await selector.entry('Authors').hover();
    await selector.recordSearchButton('Authors').click();

    await expect(selector.panel).toBeHidden();
    await expect(recordSearch.root).toContainText('Open a Record from Authors');
    await recordSearch.record('Jane Austen').click();
    await expect(page).toHaveURL(recordUrl(library.authors, 2));
    await expect(recordSearch.root).toBeHidden();
    await expect(breadcrumb.items).toHaveText([
      database.name,
      'Library',
      'Authors',
      'Jane Austen',
    ]);
    await expect(new AppShell(page).spinners).toHaveCount(0);
  });
});

test.describe('record search next to the table name in the breadcrumb', () => {
  test('finds a record of the table and opens its page', async ({
    page,
    database,
    library,
  }) => {
    const breadcrumb = new Breadcrumb(page);
    const { recordSearch } = breadcrumb;
    await page.goto(tableUrl(library.books));
    await breadcrumb.recordSearchButton.click();

    await expect(recordSearch.root).toContainText('Open a Record from Books');
    await recordSearch.record('Emma').click();
    await expect(page).toHaveURL(recordUrl(library.books, 2));
    await expect(breadcrumb.items).toHaveText([
      database.name,
      'Library',
      'Books',
      'Emma',
    ]);
    await expect(page).toHaveTitle('Emma | Mathesar');
    await expect(new AppShell(page).spinners).toHaveCount(0);
  });

  test('stays on the page when the search is closed with Escape', async ({
    page,
    library,
  }) => {
    const breadcrumb = new Breadcrumb(page);
    await page.goto(recordUrl(library.books, 1));
    await breadcrumb.recordSearchButton.click();
    await expect(breadcrumb.recordSearch.root).toBeVisible();
    await page.keyboard.press('Escape');

    await expect(breadcrumb.recordSearch.root).toBeHidden();
    await expect(page).toHaveURL(recordUrl(library.books, 1));
    await expect(new AppShell(page).spinners).toHaveCount(0);
  });
});
