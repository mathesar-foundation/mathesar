import type { Locator, Page } from '@playwright/test';

import { pinsKnownBug } from '../../support/known-bugs';
import { ABORTED_RECORDS_REQUEST } from '../../support/page-errors';
import { recordRpcCalls } from '../../support/rpc-log';
import { readClipboardText } from '../../support/ui/clipboard';
import { Breadcrumb } from '../../support/ui/components/breadcrumb';
import { Toasts } from '../../support/ui/components/toast';
import { isMarkedDocument, markDocument } from '../../support/ui/document-mark';
import { AppShell } from '../../support/ui/pages/app-shell';
import { DatabaseLayout } from '../../support/ui/pages/database-layout';
import { DatabasePage } from '../../support/ui/pages/database-page';
import { HomePage } from '../../support/ui/pages/home-page';
import { GatedTablePage } from '../../support/ui/pages/privilege-gated-pages';
import { RecordPage } from '../../support/ui/pages/record-page';
import { SchemaPage } from '../../support/ui/pages/schema-page';
import { TablePage } from '../../support/ui/pages/table-page';
import {
  databaseUrl,
  recordUrl,
  schemaUrl,
  tableUrl,
} from '../../support/ui/urls';
import { expect, test } from './fixtures';

const LIST_METHODS = [
  'databases.get',
  'schemas.list',
  'tables.list_with_metadata',
  'explorations.list',
  'forms.list',
];

/** The calls that fetch the databases, schemas, tables, explorations and forms, sorted. */
function listCalls(calls: string[]): string[] {
  return calls.filter((method) => LIST_METHODS.includes(method)).sort();
}

interface Level {
  url: string;
  breadcrumb: string[];
  /** Shows once the page has its data. */
  content: Locator;
}

async function expectLevel(page: Page, level: Level): Promise<void> {
  await expect(page).toHaveURL(level.url);
  await expect(new Breadcrumb(page).items).toHaveText(level.breadcrumb);
  await expect(level.content).toBeVisible();
}

test.describe('history', () => {
  test('walks down from the home page and back and forth through the history without loading the app again', async ({
    page,
    database,
    library,
  }) => {
    const homePage = new HomePage(page);
    const databasePage = new DatabasePage(page);
    const schemaPage = new SchemaPage(page);
    const tablePage = new TablePage(page);
    const trail = [database.name, 'Library', 'Books', 'Emma'];
    const home: Level = {
      url: '/',
      breadcrumb: [],
      content: homePage.welcome,
    };
    const databaseLevel: Level = {
      url: databaseUrl(database),
      breadcrumb: trail.slice(0, 1),
      content: databasePage.schemaRow('Library'),
    };
    const schemaLevel: Level = {
      url: schemaUrl(library.schema),
      breadcrumb: trail.slice(0, 2),
      content: schemaPage.tables.item('Books'),
    };
    const tableLevel: Level = {
      url: tableUrl(library.books),
      breadcrumb: trail.slice(0, 3),
      content: tablePage.recordCount.filter({ hasText: 'Showing 1–3 of 3' }),
    };
    const recordLevel: Level = {
      url: recordUrl(library.books, 2),
      breadcrumb: trail,
      content: new RecordPage(page).summary.filter({ hasText: 'Emma' }),
    };
    await homePage.goto();
    await markDocument(page);

    await homePage.cardLink(database.name).click();
    await expectLevel(page, databaseLevel);
    await databasePage.schemaLink('Library').click();
    await expectLevel(page, schemaLevel);
    await schemaPage.tables.link('Books').click();
    await expectLevel(page, tableLevel);
    // The table selects its first cell once it has loaded, which would undo the click.
    await expect(tablePage.sheet.activeCell).toHaveCount(1);
    await tablePage.sheet.cell(1, 'Title').click();
    await tablePage.inspector.tab('Record').click();
    await tablePage.inspector.link('Open Record').click();
    await expectLevel(page, recordLevel);

    for (const level of [tableLevel, schemaLevel, databaseLevel, home]) {
      await page.goBack();
      await expectLevel(page, level);
    }
    for (const level of [databaseLevel, schemaLevel, tableLevel, recordLevel]) {
      await page.goForward();
      await expectLevel(page, level);
    }
    await expect(new AppShell(page).spinners).toHaveCount(0);
    expect(await isMarkedDocument(page)).toBe(true);
  });

  test(
    'needs Back twice to leave a record that was opened from the record search',
    pinsKnownBug('record-search-adds-two-history-entries'),
    async ({ page, library }) => {
      const breadcrumb = new Breadcrumb(page);
      await page.goto(tableUrl(library.books));
      await breadcrumb.recordSearchButton.click();
      await breadcrumb.recordSearch.record('Emma').click();
      await expect(page).toHaveURL(recordUrl(library.books, 2));

      await page.goBack();
      await expect(page).toHaveURL(recordUrl(library.books, 2));
      await page.goBack();
      await expect(page).toHaveURL(tableUrl(library.books));
    },
  );

  test.fixme('leaves a record that was opened from the record search with one Back', async ({
    page,
    library,
  }) => {
    const breadcrumb = new Breadcrumb(page);
    await page.goto(tableUrl(library.books));
    await breadcrumb.recordSearchButton.click();
    await breadcrumb.recordSearch.record('Emma').click();
    await expect(page).toHaveURL(recordUrl(library.books, 2));

    await page.goBack();
    await expect(page).toHaveURL(tableUrl(library.books));
    await expect(new TablePage(page).recordCount).toHaveText(
      'Showing 1–3 of 3',
    );
  });
});

const newPageClicks = [
  { key: 'Control', modifier: 'ControlOrMeta' },
  { key: 'Shift', modifier: 'Shift' },
] as const;

for (const { key, modifier } of newPageClicks) {
  test(`leaves a link clicked with ${key} to the browser, which opens it in a new page`, async ({
    page,
    context,
    library,
  }) => {
    const schemaPage = new SchemaPage(page);
    await schemaPage.goto(library.schema);
    const newPage = context.waitForEvent('page');
    await schemaPage.tables.link('Books').click({ modifiers: [modifier] });

    const tablePage = new TablePage(await newPage);
    await expect(tablePage.page).toHaveURL(tableUrl(library.books));
    await expect(tablePage.recordCount).toHaveText('Showing 1–3 of 3');
    await expect(page).toHaveURL(schemaUrl(library.schema));
    await expect(schemaPage.tables.item('Books')).toBeVisible();
  });
}

test('leaves a link clicked with Alt to the browser, which downloads it', async ({
  page,
  library,
  browserName,
}) => {
  test.skip(
    browserName !== 'chromium',
    'Firefox ignores a click with Alt on a link, and WebKit follows the link',
  );
  const schemaPage = new SchemaPage(page);
  await schemaPage.goto(library.schema);
  const download = page.waitForEvent('download');
  await schemaPage.tables.link('Books').click({ modifiers: ['Alt'] });

  expect(new URL((await download).url()).pathname).toBe(
    tableUrl(library.books),
  );
  await expect(page).toHaveURL(schemaUrl(library.schema));
});

test.describe('pages that the header switches to', () => {
  test.describe(() => {
    test.use({ allowedBrowserErrors: ABORTED_RECORDS_REQUEST });

    test('a table shows its own columns, records and properties only', async ({
      page,
      library,
    }) => {
      const tablePage = new GatedTablePage(page);
      const { sheet, inspector } = tablePage;
      await tablePage.goto(library.books);
      await expect(sheet.activeCell).toHaveCount(1);
      await sheet.columnHeader('Pages').click();
      await inspector.expectOpenTab('Column');
      await expect(sheet.selectedCells).toHaveCount(3);
      await new Breadcrumb(page).tablesAndExplorations.choose('Authors');

      await expect(tablePage.heading).toHaveText('Authors');
      await expect(sheet.columnHeaders).toHaveText(['id', 'Name']);
      await expect(sheet.recordRows).toHaveText([
        /Frank Herbert/,
        /Jane Austen/,
      ]);
      await expect(tablePage.recordCount).toHaveText('Showing 1–2 of 2');
      await inspector.expectOpenTab('Table');
      await expect(tablePage.tableName).toHaveValue('Authors');
      await expect(sheet.selectedCells).toHaveCount(0);
    });
  });

  test('a schema shows its own tables', async ({ page, library, shop }) => {
    const schemaPage = new SchemaPage(page);
    await schemaPage.goto(library.schema);
    await expect(schemaPage.tables.items).toHaveCount(3);
    await new Breadcrumb(page).schemas.choose(shop.name);

    await expect(schemaPage.header).toContainText(shop.name);
    await expect(schemaPage.tables.items).toHaveCount(1);
    await expect(schemaPage.tables.item('Orders')).toBeVisible();
  });

  test('a database shows its own schemas', async ({
    page,
    database,
    library,
    otherDatabase,
  }) => {
    const databasePage = new DatabasePage(page);
    await databasePage.goto(database);
    await expect(databasePage.schemaRow(library.schema.name)).toBeVisible();
    await new Breadcrumb(page).databases.choose(otherDatabase.name);

    await expect(new DatabaseLayout(page).header).toContainText(
      otherDatabase.name,
    );
    await expect(databasePage.schemaRows).toHaveCount(1);
    await expect(databasePage.schemaRow('public')).toBeVisible();
  });
});

test('copies the selected text of the home page after the user leaves a table', async ({
  page,
  library,
}) => {
  const tablePage = new TablePage(page);
  const homePage = new HomePage(page);
  await tablePage.goto(library.books);
  await tablePage.sheet.cell(1, 'Title').click();
  await page.keyboard.press('Control+c');
  await new Toasts(page).expectMessage('Copied 1 cell');
  await new Breadcrumb(page).homeLink.click();
  await homePage.welcome.selectText();
  await page.keyboard.press('Control+c');

  const welcome = await homePage.welcome.innerText();
  await expect.poll(() => readClipboardText(page)).toBe(welcome);
});

test.describe('requests for the lists of the header and the pages', () => {
  test('a page load fetches only what the server did not send with the page', async ({
    page,
    database,
    library,
  }) => {
    const loads: { url: string; content: Locator; fetches: string[] }[] = [
      { url: '/', content: new HomePage(page).welcome, fetches: [] },
      {
        url: databaseUrl(database),
        content: new DatabasePage(page).schemaRow('Library'),
        fetches: ['databases.get'],
      },
      {
        url: schemaUrl(library.schema),
        content: new SchemaPage(page).tables.item('Books'),
        fetches: ['forms.list'],
      },
      {
        url: tableUrl(library.books),
        content: new TablePage(page).recordCount.filter({
          hasText: 'Showing 1–3 of 3',
        }),
        fetches: [],
      },
    ];
    for (const { url, content, fetches } of loads) {
      const calls = recordRpcCalls(page);
      await page.goto(url);
      await expect(content).toBeVisible();
      await expect.poll(() => listCalls(calls), url).toEqual(fetches);
    }
  });

  test('moving down from the home page fetches each list once and moving up fetches nothing', async ({
    page,
    database,
    library,
  }) => {
    const homePage = new HomePage(page);
    const databasePage = new DatabasePage(page);
    const schemaPage = new SchemaPage(page);
    const tablePage = new TablePage(page);
    const breadcrumb = new Breadcrumb(page);
    await homePage.goto();
    await expect(homePage.cardLink(database.name)).toBeVisible();

    let calls = recordRpcCalls(page);
    await homePage.cardLink(database.name).click();
    await expect(databasePage.schemaRow(library.schema.name)).toBeVisible();
    await expect
      .poll(() => listCalls(calls))
      .toEqual(['databases.get', 'schemas.list']);

    calls = recordRpcCalls(page);
    await databasePage.schemaLink(library.schema.name).click();
    await expect(schemaPage.tables.item('Books')).toBeVisible();
    await expect
      .poll(() => listCalls(calls))
      .toEqual([
        'explorations.list',
        'forms.list',
        'tables.list_with_metadata',
      ]);

    calls = recordRpcCalls(page);
    await schemaPage.tables.link('Books').click();
    await expect(tablePage.recordCount).toHaveText('Showing 1–3 of 3');
    expect(listCalls(calls)).toEqual([]);

    calls = recordRpcCalls(page);
    await breadcrumb.item(library.schema.name).click();
    await expect(schemaPage.tables.item('Books')).toBeVisible();
    await breadcrumb.item(database.name).click();
    await expect(databasePage.schemaRow(library.schema.name)).toBeVisible();
    await breadcrumb.homeLink.click();
    await expect(homePage.welcome).toBeVisible();
    expect(calls).toEqual([]);
  });

  test.describe(() => {
    test.use({ allowedBrowserErrors: ABORTED_RECORDS_REQUEST });

    test('another table fetches no list', async ({ page, library }) => {
      const tablePage = new TablePage(page);
      await tablePage.goto(library.books);
      await expect(tablePage.recordCount).toHaveText('Showing 1–3 of 3');

      const calls = recordRpcCalls(page);
      await new Breadcrumb(page).tablesAndExplorations.choose('Authors');
      await expect(tablePage.recordCount).toHaveText('Showing 1–2 of 2');
      expect(listCalls(calls)).toEqual([]);
    });
  });

  test('another schema fetches its lists, and the first one refetches all but its tables', async ({
    page,
    library,
    shop,
  }) => {
    const schemaPage = new SchemaPage(page);
    const { schemas } = new Breadcrumb(page);
    await schemaPage.goto(library.schema);
    await expect(schemaPage.tables.item('Books')).toBeVisible();

    let calls = recordRpcCalls(page);
    await schemas.choose(shop.name);
    await expect(schemaPage.tables.item('Orders')).toBeVisible();
    await expect
      .poll(() => listCalls(calls))
      .toEqual([
        'explorations.list',
        'forms.list',
        'tables.list_with_metadata',
      ]);

    calls = recordRpcCalls(page);
    await schemas.choose(library.schema.name);
    await expect(schemaPage.tables.item('Books')).toBeVisible();
    await expect
      .poll(() => listCalls(calls))
      .toEqual(['explorations.list', 'forms.list']);
  });

  test('another database fetches itself and its schemas', async ({
    page,
    database,
    otherDatabase,
  }) => {
    const databasePage = new DatabasePage(page);
    await databasePage.goto(database);
    await expect(databasePage.schemaRow('public')).toBeVisible();

    const calls = recordRpcCalls(page);
    await new Breadcrumb(page).databases.choose(otherDatabase.name);
    await expect(new DatabaseLayout(page).header).toContainText(
      otherDatabase.name,
    );
    await expect
      .poll(() => listCalls(calls))
      .toEqual(['databases.get', 'schemas.list']);
  });
});
