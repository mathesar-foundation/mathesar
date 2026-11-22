import type { Locator } from '@playwright/test';

import { type Schema, runSqlInSchema } from '../../support/api/mathesar';
import { pinsKnownBug } from '../../support/known-bugs';
import { recordRpcCalls } from '../../support/rpc-log';
import { failRpcMethod } from '../../support/rpc-failures';
import { writeClipboardText } from '../../support/ui/clipboard';
import {
  hiddenPillCount,
  linkedRecordCount,
  linkedRecordPills,
  pickRecordButton,
} from '../../support/ui/components/linked-record';
import { menuItem, openMenu } from '../../support/ui/components/menu';
import { Modal } from '../../support/ui/components/modal';
import { MultiTagger } from '../../support/ui/components/multi-tagger';
import { Toasts } from '../../support/ui/components/toast';
import { tooltip } from '../../support/ui/components/tooltip';
import { descriptionIcon } from '../../support/ui/pages/column-inspector';
import { ExtendDropdown } from '../../support/ui/pages/extend-dropdown';
import { TablePage } from '../../support/ui/pages/table-page';
import { tableUrl } from '../../support/ui/urls';
import { expect, test } from './library';

/** A joined column is this wide, whatever width it was given before. */
const JOINED_COLUMN_WIDTH = 300;

async function widthOf(locator: Locator): Promise<number | undefined> {
  return (await locator.boundingBox())?.width;
}

/** The ids of the tags that the mapping table links to "Dune", the first book. */
async function storedTagsOfDune(schema: Schema): Promise<number[]> {
  const links = await runSqlInSchema<{ Tag: number }>(
    schema,
    'SELECT "Tag" FROM "Books_Tags" WHERE "Book" = 1 ORDER BY "Tag"',
  );
  return links.map((link) => link.Tag);
}

test.describe('the "Extend" dropdown of a table', () => {
  let tablePage: TablePage;
  let extend: ExtendDropdown;

  test.beforeEach(({ page }) => {
    tablePage = new TablePage(page);
    extend = new ExtendDropdown(page);
  });

  test('lists the tables that a mapping table relates to this one', async ({
    library,
  }) => {
    await tablePage.goto(library.books);
    await extend.trigger.click();

    await expect(extend.relatedTables).toHaveCount(1);
    await expect(extend.relatedTable('Tags via Books_Tags')).not.toBeChecked();
  });

  test('says "(None)" for a table without such a relationship', async ({
    library,
  }) => {
    await tablePage.goto(library.publishers);
    await extend.trigger.click();

    await expect(extend.panel).toContainText('(None)');
    await expect(extend.relatedTables).toHaveCount(0);
  });

  test('a checked table becomes a joined column with the linked records as pills', async ({
    page,
    library,
  }) => {
    const { sheet } = tablePage;
    await tablePage.goto(library.books);
    await extend.trigger.click();
    const rpcCalls = recordRpcCalls(page);
    await extend.relatedTable('Tags via Books_Tags').check();

    await expect(sheet.columnHeader('Tags')).toBeVisible();
    await expect(linkedRecordPills(sheet.cell(0, 'Tags'))).toHaveText([
      'classic',
      'scifi',
    ]);
    await expect(linkedRecordCount(sheet.cell(0, 'Tags'))).toHaveText('2');
    await expect(linkedRecordPills(sheet.cell(2, 'Tags'))).toHaveCount(0);
    await expect(linkedRecordCount(sheet.cell(2, 'Tags'))).toHaveCount(0);
    await expect(extend.trigger).toHaveText('Extend 1');
    expect(rpcCalls).toEqual(['records.list']);
  });

  test('the joined column survives a reload and goes away when unchecked', async ({
    page,
    library,
  }) => {
    const { sheet } = tablePage;
    await tablePage.goto(library.books);
    await extend.trigger.click();
    await extend.relatedTable('Tags via Books_Tags').check();
    await expect(sheet.columnHeader('Tags')).toBeVisible();

    await page.reload();
    await tablePage.expectLoaded();
    await expect(sheet.columnHeader('Tags')).toBeVisible();
    await extend.trigger.click();
    await expect(extend.relatedTable('Tags via Books_Tags')).toBeChecked();

    await extend.relatedTable('Tags via Books_Tags').uncheck();
    await expect(sheet.columnHeader('Tags')).toHaveCount(0);
    await expect(sheet.columnHeaders).toHaveCount(5);
  });

  test('a cell shows 25 pills at most and counts the rest', async ({
    schema,
    library,
  }) => {
    await runSqlInSchema(
      schema,
      `INSERT INTO "Tags" ("Label")
         SELECT 'tag ' || n FROM generate_series(1, 26) AS n;
       INSERT INTO "Books_Tags" ("Book", "Tag") SELECT 3, id FROM "Tags";`,
    );
    const tags = tablePage.sheet.cell(2, 'Tags');
    await tablePage.goto(library.books);
    await extend.trigger.click();
    await extend.relatedTable('Tags via Books_Tags').check();

    await expect(linkedRecordPills(tags)).toHaveCount(25);
    await expect(hiddenPillCount(tags)).toHaveText('+5');
    await expect(linkedRecordCount(tags)).toHaveText('30');
  });
});

test.describe('a joined column', () => {
  let tablePage: TablePage;
  let tagger: MultiTagger;

  test.beforeEach(async ({ page, library }) => {
    tablePage = new TablePage(page);
    tagger = new MultiTagger(page);
    const extend = new ExtendDropdown(page);
    await tablePage.goto(library.books);
    await extend.trigger.click();
    await extend.relatedTable('Tags via Books_Tags').check();
    await extend.trigger.click();
    await expect(extend.panel).toHaveCount(0);
    // The column shows before its values, and their arrival clears the selection.
    await expect(linkedRecordPills(tablePage.sheet.cell(0, 'Tags'))).toHaveText(
      ['classic', 'scifi'],
    );
  });

  test.describe('opens the multi-tagger', () => {
    test('on Enter, with the linked records checked and the focus in the search', async ({
      page,
    }) => {
      await tablePage.sheet.cell(0, 'Tags').click();
      await expect(tagger.root).toHaveCount(0);
      await page.keyboard.press('Enter');

      await expect(tagger.options).toHaveText([
        'classic',
        'drama',
        'romance',
        'scifi',
      ]);
      await expect(tagger.checkedOptions).toHaveText(['classic', 'scifi']);
      await expect(tagger.search).toBeFocused();
      await expect(tagger.search).toHaveAttribute('placeholder', 'search');
    });

    test('on a click on the active cell', async () => {
      await tablePage.sheet.cell(0, 'Tags').click();
      await tablePage.sheet.cell(0, 'Tags').click();

      await expect(tagger.root).toBeVisible();
    });

    test('on a double click', async () => {
      await tablePage.sheet.cell(2, 'Tags').dblclick();

      await expect(tagger.options).toHaveCount(4);
      await expect(tagger.checkedOptions).toHaveCount(0);
    });

    test('on a click on the "Pick a record" button', async () => {
      await pickRecordButton(tablePage.sheet.cell(1, 'Tags')).click();

      await expect(tagger.checkedOptions).toHaveText(['classic', 'romance']);
      await expect(tablePage.sheet.cell(1, 'Tags')).toHaveAttribute(
        'data-cell-active',
      );
    });
  });

  test('checking a record adds a row to the mapping table and a pill to the cell', async ({
    schema,
  }) => {
    const tags = tablePage.sheet.cell(0, 'Tags');
    await tags.dblclick();
    await tagger.option('romance').click();

    await expect(tagger.checkedOptions).toHaveText([
      'classic',
      'romance',
      'scifi',
    ]);
    await expect(linkedRecordPills(tags)).toHaveText([
      'classic',
      'scifi',
      'romance',
    ]);
    await expect(linkedRecordCount(tags)).toHaveText('3');
    await expect(tagger.search).toBeFocused();
    expect(await storedTagsOfDune(schema)).toEqual([1, 2, 3]);
  });

  test('unchecking a record deletes its row of the mapping table and its pill', async ({
    schema,
  }) => {
    const tags = tablePage.sheet.cell(0, 'Tags');
    await tags.dblclick();
    await tagger.option('scifi').click();

    await expect(tagger.checkedOptions).toHaveText(['classic']);
    await expect(linkedRecordPills(tags)).toHaveText(['classic']);
    await expect(linkedRecordCount(tags)).toHaveText('1');
    expect(await storedTagsOfDune(schema)).toEqual([1]);
  });

  test('shows why a link cannot be stored and leaves the record unchecked', async ({
    page,
    schema,
  }) => {
    await failRpcMethod(page, 'records.add', 'The link is refused');
    await tablePage.sheet.cell(0, 'Tags').dblclick();
    await tagger.option('drama').click();

    await new Toasts(page).expectMessage('The link is refused');
    await expect(tagger.checkedOptions).toHaveText(['classic', 'scifi']);
    expect(await storedTagsOfDune(schema)).toEqual([1, 2]);
  });

  test('the arrow keys move a highlight and Enter toggles the highlighted record', async ({
    page,
    schema,
  }) => {
    await tablePage.sheet.cell(0, 'Tags').dblclick();
    await expect(tagger.options).toHaveCount(4);
    await page.keyboard.press('ArrowDown');
    await expect(tagger.highlightedOption).toHaveText('classic');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowUp');
    await expect(tagger.highlightedOption).toHaveText('drama');

    await page.keyboard.press('Enter');
    await expect(tagger.checkedOptions).toHaveText([
      'classic',
      'drama',
      'scifi',
    ]);
    await expect.poll(() => storedTagsOfDune(schema)).toEqual([1, 2, 4]);
  });

  test('the search narrows the records and says when none is found', async () => {
    await tablePage.sheet.cell(0, 'Tags').dblclick();
    await tagger.search.fill('dr');
    await expect(tagger.options).toHaveText(['drama']);

    await tagger.search.fill('nothing');
    await expect(tagger.options).toHaveCount(0);
    await expect(tagger.emptyNote).toBeVisible();
  });

  test('Escape closes the multi-tagger and returns the focus to the cell', async ({
    page,
  }) => {
    const { sheet } = tablePage;
    await sheet.cell(0, 'Tags').dblclick();
    await expect(tagger.search).toBeFocused();
    await page.keyboard.press('Escape');

    await expect(tagger.root).toHaveCount(0);
    await sheet.expectFocusOnActiveCell();
    await page.keyboard.press('ArrowLeft');
    await expect(sheet.activeCell).toHaveText('412');
  });

  test('a click on another cell closes the multi-tagger and selects that cell', async () => {
    const { sheet } = tablePage;
    await sheet.cell(0, 'Tags').dblclick();
    await expect(tagger.root).toBeVisible();
    await sheet.cell(3, 'Title').click();

    await expect(tagger.root).toHaveCount(0);
    await expect(sheet.activeCell).toHaveText('Beloved');
  });

  test('the context menu of its cells only offers the row and column actions', async ({
    page,
  }) => {
    await tablePage.sheet.cell(0, 'Tags').click({ button: 'right' });

    await expect(openMenu(page).getByRole('menuitem')).toHaveText([
      'Set to NULL',
      'Row',
      'Column',
    ]);
    await expect(menuItem(page, 'Set to NULL')).toBeDisabled();
  });

  test('the menu of its header links to the related table and to the mapping table', async ({
    page,
    library,
  }) => {
    await tablePage.sheet.columnHeader('Tags').click({ button: 'right' });

    await expect(openMenu(page).getByRole('menuitem')).toHaveCount(0);
    await expect(
      openMenu(page).getByRole('link', { name: 'Open Tags table' }),
    ).toHaveAttribute('href', tableUrl(library.tags));
    await expect(
      openMenu(page).getByRole('link', { name: 'Open Books_Tags table' }),
    ).toHaveAttribute('href', tableUrl(library.booksTags));
  });

  test('the Column tab of the inspector names the related table and the mapping table', async ({
    library,
  }) => {
    const { inspector } = tablePage;
    await tablePage.sheet.columnHeader('Tags').click();

    await inspector.expectOpenTab('Column');
    await expect(inspector.panel).toHaveText(
      /This column shows related data from the\s+Tags\s+table, via\s+Books_Tags/,
    );
    await expect(inspector.link('Books_Tags')).toHaveAttribute(
      'href',
      tableUrl(library.booksTags),
    );
  });

  test('the Cell tab of the inspector lists the linked records and counts them', async () => {
    const { inspector } = tablePage;
    await tablePage.sheet.cell(0, 'Tags').click();
    await inspector.tab('Cell').click();

    await expect(inspector.panel).toHaveText(/classic\s*scifi\s*2 Records/);
  });

  test('the help of its header names the related table and the mapping table', async ({
    page,
    library,
  }) => {
    await descriptionIcon(tablePage.sheet, 'Tags').hover();

    await expect(tooltip(page)).toHaveText(
      /This column shows related data from the\s+Tags\s+table, via\s+Books_Tags/,
    );
    await expect(
      tooltip(page).getByRole('link', { name: 'Tags', exact: true }),
    ).toHaveAttribute('href', tableUrl(library.tags));
    await expect(
      tooltip(page).getByRole('link', { name: 'Books_Tags' }),
    ).toHaveAttribute('href', tableUrl(library.booksTags));
  });

  test('a drag of its edge resizes it until the page reloads, and no width is stored', async ({
    page,
  }) => {
    const { sheet } = tablePage;
    const rpcCalls = recordRpcCalls(page);
    // The column ends behind the inspector.
    await sheet.resizeHandle('Tags').scrollIntoViewIfNeeded();
    await sheet.dragColumnEdge('Tags', 60);
    await expect
      .poll(() => widthOf(sheet.columnHeader('Tags')))
      .toBe(JOINED_COLUMN_WIDTH + 60);

    await page.reload();
    await tablePage.expectLoaded();
    await expect(linkedRecordPills(sheet.cell(0, 'Tags'))).toHaveText([
      'classic',
      'scifi',
    ]);
    expect(await widthOf(sheet.columnHeader('Tags'))).toBe(JOINED_COLUMN_WIDTH);
    expect(rpcCalls).toContain('records.list');
    expect(rpcCalls).not.toContain('columns.metadata.set');
  });

  test('a drag that ends on its cells selects the cells of the other columns only', async () => {
    const { sheet } = tablePage;
    await sheet.dragBetween(sheet.cell(0, 'Publisher'), sheet.cell(1, 'Tags'));

    await expect(sheet.selectedCells).toHaveText([
      'Ace',
      '412',
      'Penguin',
      '320',
    ]);
    await expect(sheet.activeCell).toHaveText('Ace');
  });

  test('a Shift click on its cells selects the cells of the other columns only', async () => {
    const { sheet } = tablePage;
    await sheet.cell(0, 'Pages').click();
    await sheet.cell(2, 'Tags').click({ modifiers: ['Shift'] });

    await expect(sheet.selectedCells).toHaveText(['412', '320', '730']);
  });

  test('a selected row leaves its cell out', async () => {
    const { sheet } = tablePage;
    await sheet.rowHeader(1).click();

    await expect(sheet.selectedCells).toHaveText([
      '2',
      'Emma',
      'Jane Austen',
      'Penguin',
      '320',
    ]);
  });

  test('a click on its header selects its first cell only, and a Shift click on it selects the other columns only', async () => {
    const { sheet } = tablePage;
    await sheet.columnHeader('Tags').click();
    await expect(sheet.cell(0, 'Tags')).toHaveAttribute('data-cell-active');
    await expect(sheet.selectedCells).toHaveCount(1);

    await sheet.columnHeader('Pages').click();
    await sheet.columnHeader('Tags').click({ modifiers: ['Shift'] });
    await expect(sheet.selectedCells).toHaveText([
      '412',
      '320',
      '730',
      '324',
      'NULL',
      '250',
    ]);
  });

  test('a range that starts on one of its cells keeps that cell only, drawn with the mouse or the keys', async ({
    page,
  }) => {
    const { sheet } = tablePage;
    await sheet.dragBetween(sheet.cell(0, 'Tags'), sheet.cell(2, 'Title'));
    await expect(sheet.cell(0, 'Tags')).toHaveAttribute('data-cell-active');
    await expect(sheet.selectedCells).toHaveCount(1);

    await sheet.cell(3, 'Title').click({ modifiers: ['Shift'] });
    await expect(sheet.selectedCells).toHaveCount(1);
    await page.keyboard.press('Shift+ArrowDown');
    await expect(sheet.selectedCells).toHaveCount(1);
    await expect(sheet.cell(0, 'Tags')).toHaveAttribute('data-cell-active');
  });

  test('the arrow keys move into its cells and along them one cell at a time', async ({
    page,
  }) => {
    const { sheet } = tablePage;
    await sheet.cell(0, 'Pages').click();
    await page.keyboard.press('ArrowRight');
    await expect(sheet.cell(0, 'Tags')).toHaveAttribute('data-cell-active');

    await page.keyboard.press('ArrowDown');
    await expect(sheet.cell(1, 'Tags')).toHaveAttribute('data-cell-active');
    await expect(sheet.selectedCells).toHaveCount(1);
    await sheet.expectFocusOnActiveCell();
  });

  test('Shift and an arrow key do not grow a selection into its cells', async ({
    page,
  }) => {
    const { sheet } = tablePage;
    await sheet.cell(0, 'Pages').click();
    await page.keyboard.press('Shift+ArrowRight');
    await page.keyboard.press('Shift+ArrowDown');

    await expect(sheet.selectedCells).toHaveText(['412', '320']);
  });

  test('a paste into one of its cells changes nothing', async ({
    page,
    schema,
  }) => {
    const { sheet } = tablePage;
    await writeClipboardText(page, 'drama');
    const rpcCalls = recordRpcCalls(page);
    await sheet.cell(0, 'Tags').click();
    await page.keyboard.press('Control+v');
    // The same paste into another cell asks first, so the first one is over.
    await sheet.cell(0, 'Title').click();
    await page.keyboard.press('Control+v');
    const pasteConfirmation = new Modal(page, 'Paste 1 cell?');
    await pasteConfirmation.button('Cancel').click();

    await pasteConfirmation.expectClosed();
    await expect(new Toasts(page).items).toHaveCount(0);
    await expect(linkedRecordPills(sheet.cell(0, 'Tags'))).toHaveText([
      'classic',
      'scifi',
    ]);
    expect(rpcCalls).toEqual([]);
    expect(await storedTagsOfDune(schema)).toEqual([1, 2]);
  });
});

/** The links of the books in "Shelves", in the order of their ids. */
function storedShelves(
  schema: Schema,
): Promise<{ Book: number; Tag: number }[]> {
  return runSqlInSchema(
    schema,
    'SELECT "Book", "Tag" FROM "Shelves" ORDER BY id',
  );
}

test.describe('a mapping table whose link columns come before its primary key', () => {
  let tablePage: TablePage;
  let tagger: MultiTagger;

  test.beforeEach(async ({ page, schema, library }) => {
    tablePage = new TablePage(page);
    tagger = new MultiTagger(page);
    // The dropped columns give the link columns the attnums 10 and 11, and the key 12.
    await runSqlInSchema(
      schema,
      `CREATE TABLE "Shelves" (c1 int, c2 int, c3 int, c4 int, c5 int, c6 int, c7 int, c8 int, c9 int);
       ALTER TABLE "Shelves" DROP COLUMN c1, DROP COLUMN c2, DROP COLUMN c3,
         DROP COLUMN c4, DROP COLUMN c5, DROP COLUMN c6, DROP COLUMN c7,
         DROP COLUMN c8, DROP COLUMN c9;
       ALTER TABLE "Shelves"
         ADD COLUMN "Book" integer NOT NULL REFERENCES "Books" (id),
         ADD COLUMN "Tag" integer NOT NULL REFERENCES "Tags" (id),
         ADD COLUMN id integer PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY;
       INSERT INTO "Shelves" ("Book", "Tag") VALUES (2, 1);`,
    );
    const extend = new ExtendDropdown(page);
    await tablePage.goto(library.books);
    await extend.trigger.click();
    await extend.relatedTable('Tags via Shelves').check();
    await extend.trigger.click();
    await expect(linkedRecordPills(tablePage.sheet.cell(1, 'Tags'))).toHaveText(
      ['classic'],
    );
    await tablePage.sheet.cell(0, 'Tags').dblclick();
    await tagger.option('drama').click();
    await expect(tagger.checkedOptions).toHaveText(['drama']);
  });

  test(
    'unchecking a record that was just checked deletes the link of another book',
    pinsKnownBug('multi-tagger-deletes-wrong-link'),
    async ({ schema }) => {
      await tagger.option('drama').click();

      await expect(tagger.checkedOptions).toHaveCount(0);
      await expect
        .poll(() => storedShelves(schema))
        .toEqual([{ Book: 1, Tag: 4 }]);
    },
  );

  test.fixme('unchecking a record that was just checked deletes the link that was added', async ({
    schema,
  }) => {
    await tagger.option('drama').click();

    await expect(tagger.checkedOptions).toHaveCount(0);
    await expect
      .poll(() => storedShelves(schema))
      .toEqual([{ Book: 2, Tag: 1 }]);
  });
});
