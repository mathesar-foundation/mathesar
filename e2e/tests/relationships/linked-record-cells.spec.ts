import { type Schema, runSqlInSchema } from '../../support/api/mathesar';
import { recordRpcCalls } from '../../support/rpc-log';
import { pickRecordButton } from '../../support/ui/components/linked-record';
import { menuItem, openMenu } from '../../support/ui/components/menu';
import { RecordSelector } from '../../support/ui/components/record-selector';
import { RecordModal, RecordPage } from '../../support/ui/pages/record-page';
import { TablePage } from '../../support/ui/pages/table-page';
import { recordUrl, tableUrl } from '../../support/ui/urls';
import { expect, test } from './library';

/** The author of each book in PostgreSQL, in the order of the book ids. */
async function storedAuthors(schema: Schema): Promise<(number | null)[]> {
  const books = await runSqlInSchema<{ Author: number | null }>(
    schema,
    'SELECT "Author" FROM "Books" ORDER BY id',
  );
  return books.map((book) => book.Author);
}

test.describe('a cell of a column that links to another table', () => {
  let tablePage: TablePage;
  let selector: RecordSelector;

  test.beforeEach(async ({ page, library }) => {
    tablePage = new TablePage(page);
    selector = new RecordSelector(page);
    await tablePage.goto(library.books);
  });

  test('shows the summary of the linked record, or NULL, and a button to pick a record', async () => {
    const { sheet } = tablePage;

    await expect(sheet.cell(0, 'Author')).toHaveText('Frank Herbert');
    await expect(sheet.cell(0, 'Publisher')).toHaveText('Ace');
    await expect(sheet.cell(4, 'Author')).toHaveText('NULL');
    await expect(pickRecordButton(sheet.cell(0, 'Author'))).toBeVisible();
    await expect(pickRecordButton(sheet.cell(4, 'Author'))).toBeVisible();
  });

  test('a click selects the cell and a second click opens the record selector', async () => {
    const author = tablePage.sheet.cell(1, 'Author');
    await author.click();
    await expect(author).toHaveAttribute('data-cell-active');
    await selector.expectClosed();

    await author.click();
    await expect(selector.title).toHaveText('Pick a Record from Authors');
  });

  test('Enter on the active cell opens the record selector', async ({
    page,
  }) => {
    await tablePage.sheet.cell(1, 'Author').click();
    await page.keyboard.press('Enter');

    await selector.expectOpen();
  });

  test('a double click opens the record selector and it stays open', async () => {
    await tablePage.sheet.cell(1, 'Author').dblclick();

    await expect(selector.rows).toHaveCount(4);
    await selector.searchInput('Name').fill('toni');
    await expect(selector.rows).toHaveCount(1);
  });

  test('the "Pick a record" button opens the selector for a cell that was not selected', async () => {
    const { sheet } = tablePage;
    await pickRecordButton(sheet.cell(2, 'Publisher')).click();

    await expect(selector.title).toHaveText('Pick a Record from Publishers');
    await expect(sheet.cell(2, 'Publisher')).toHaveAttribute(
      'data-cell-active',
    );
  });

  test('a Shift click on the "Pick a record" button extends the selection instead', async () => {
    const { sheet } = tablePage;
    await sheet.cell(0, 'Author').click();
    await pickRecordButton(sheet.cell(2, 'Author')).click({
      modifiers: ['Shift'],
    });

    await expect(sheet.selectedCells).toHaveText([
      'Frank Herbert',
      'Jane Austen',
      'James Joyce',
    ]);
    await selector.expectClosed();
  });

  test('a chosen record is stored, shown by its summary, and the focus returns to the cell', async ({
    page,
    schema,
  }) => {
    const { sheet } = tablePage;
    const rpcCalls = recordRpcCalls(page);
    await sheet.cell(4, 'Author').dblclick();
    await selector.row('James Joyce').click();

    await selector.expectClosed();
    await expect(sheet.cell(4, 'Author')).toHaveText('James Joyce');
    await expect(sheet.cell(4, 'Author')).toHaveAttribute('data-cell-active');
    await sheet.expectFocusOnActiveCell();
    await expect.poll(() => storedAuthors(schema)).toEqual([1, 2, 3, 4, 3, 2]);
    expect(rpcCalls.filter((method) => method === 'records.patch')).toEqual([
      'records.patch',
    ]);

    await page.keyboard.press('ArrowRight');
    await expect(sheet.cell(4, 'Publisher')).toHaveAttribute(
      'data-cell-active',
    );
  });

  test('Escape closes the selector, keeps the value and returns the focus to the cell', async ({
    page,
    schema,
  }) => {
    const { sheet } = tablePage;
    const rpcCalls = recordRpcCalls(page);
    await sheet.cell(1, 'Author').dblclick();
    await expect(selector.rows).toHaveCount(4);
    await page.keyboard.press('Escape');

    await selector.expectClosed();
    await expect(sheet.cell(1, 'Author')).toHaveText('Jane Austen');
    await sheet.expectFocusOnActiveCell();
    await page.keyboard.press('ArrowDown');
    await expect(sheet.activeCell).toHaveText('James Joyce');
    expect(rpcCalls).not.toContain('records.patch');
    expect(await storedAuthors(schema)).toEqual([1, 2, 3, 4, null, 2]);
  });

  test('the arrow keys and Tab cross linked cells without opening the selector', async ({
    page,
  }) => {
    const { sheet } = tablePage;
    await sheet.cell(0, 'Title').click();

    await page.keyboard.press('ArrowRight');
    await expect(sheet.activeCell).toHaveText('Frank Herbert');
    await page.keyboard.press('Tab');
    await expect(sheet.activeCell).toHaveText('Ace');
    await page.keyboard.press('ArrowDown');
    await expect(sheet.activeCell).toHaveText('Penguin');
    await page.keyboard.press('ArrowLeft');
    await expect(sheet.activeCell).toHaveText('Jane Austen');

    await sheet.expectFocusOnActiveCell();
    await selector.expectClosed();
  });

  test('a record picked in the empty last row adds a record that links to it', async ({
    schema,
  }) => {
    const { sheet } = tablePage;
    await sheet.placeholderCell('Author').dblclick();
    await selector.row('Toni Morrison').click();

    await expect(sheet.recordRows).toHaveCount(7);
    await expect(sheet.cell(6, 'Author')).toHaveText('Toni Morrison');
    await expect
      .poll(() => storedAuthors(schema))
      .toEqual([1, 2, 3, 4, null, 2, 4]);
  });
});

test.describe('the context menu of a linked cell', () => {
  let tablePage: TablePage;

  test.beforeEach(async ({ page, library }) => {
    tablePage = new TablePage(page);
    await tablePage.goto(library.books);
  });

  test('names the linked record in entries that view and open it', async ({
    page,
    library,
  }) => {
    await tablePage.sheet.cell(0, 'Author').click({ button: 'right' });

    await expect(openMenu(page).getByRole('menuitem')).toHaveText([
      'Quick View Frank Herbert',
      'Copy',
      'Paste',
      'Set to NULL',
      'Row',
      'Column',
    ]);
    await expect(
      openMenu(page).getByRole('link', { name: 'Open Frank Herbert' }),
    ).toHaveAttribute('href', recordUrl(library.authors, 1));
  });

  test('has no entries for a linked record on an empty cell', async ({
    page,
  }) => {
    await tablePage.sheet.cell(4, 'Author').click({ button: 'right' });

    await expect(openMenu(page).getByRole('menuitem')).toHaveText([
      'Copy',
      'Paste',
      'Set to NULL',
      'Row',
      'Column',
    ]);
    await expect(openMenu(page).getByRole('link')).toHaveCount(0);
  });

  test('"Quick View" opens the linked record in a modal', async ({ page }) => {
    await tablePage.sheet.cell(1, 'Author').click({ button: 'right' });
    await menuItem(page, 'Quick View Jane Austen').click();

    const modal = new RecordModal(page);
    await expect(modal.title).toContainText('Jane Austen');
    await expect(modal.title).toContainText('Record in Authors');
    await expect(modal.view.field('Country')).toHaveValue('UK');
  });

  test('"Open" goes to the page of the linked record', async ({
    page,
    library,
  }) => {
    await tablePage.sheet.cell(1, 'Publisher').click({ button: 'right' });
    await openMenu(page).getByRole('link', { name: 'Open Penguin' }).click();

    await expect(page).toHaveURL(recordUrl(library.publishers, 2));
    const recordPage = new RecordPage(page);
    await expect(recordPage.summary).toHaveText('Penguin');
    await expect(recordPage.relatedRecordHeadings).toHaveText([
      'Authors',
      'Books',
    ]);
  });

  test('"Set to NULL" removes the link', async ({ page, schema }) => {
    const { sheet } = tablePage;
    await sheet.cell(0, 'Author').click({ button: 'right' });
    await menuItem(page, 'Set to NULL').click();

    await expect(sheet.cell(0, 'Author')).toHaveText('NULL');
    await expect
      .poll(() => storedAuthors(schema))
      .toEqual([null, 2, 3, 4, null, 2]);
  });
});

test('the menu of the header of a linking column opens the table that it links to', async ({
  page,
  library,
}) => {
  const tablePage = new TablePage(page);
  await tablePage.goto(library.books);
  await tablePage.sheet.columnHeader('Author').click({ button: 'right' });
  const openTable = openMenu(page).getByRole('link', {
    name: 'Open Authors table',
  });
  await expect(openTable).toHaveAttribute('href', tableUrl(library.authors));
  await openTable.click();

  await expect(page).toHaveURL(tableUrl(library.authors));
  await expect(tablePage.heading).toHaveText('Authors');
  await expect(tablePage.sheet.cell(0, 'Name')).toHaveText('Frank Herbert');
});
