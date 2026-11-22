import { type Schema, runSqlInSchema } from '../../support/api/mathesar';
import { holdRpcCalls } from '../../support/held-requests';
import { pinsKnownBug } from '../../support/known-bugs';
import { pauseClock } from '../../support/ui/clock';
import { columnIndicator } from '../../support/ui/components/column-indicators';
import { pickRecordButton } from '../../support/ui/components/linked-record';
import { menuItem } from '../../support/ui/components/menu';
import { Toasts } from '../../support/ui/components/toast';
import { ColumnInspector } from '../../support/ui/pages/column-inspector';
import { ExtractColumnsModal } from '../../support/ui/pages/extract-columns-modal';
import { TablePage } from '../../support/ui/pages/table-page';
import { chooseOption } from '../../support/ui/components/select';
import { expect, foreignKeys, test } from './library';

// When the table reloads before the closed form has faded out, the form is
// destroyed twice and the app throws this. It depends on the server speed.
const FORM_DESTROYED_TWICE =
  /Cannot read properties of null \(reading 'removeChild'\)|can't access property "removeChild", \w+\.parentNode is null|null is not an object \(evaluating '\w+\.parentNode\.removeChild'\)/;

/** A genre for each book but "Ulysses", to extract into a table of genres. */
const ADD_GENRES = `ALTER TABLE "Books" ADD COLUMN "Genre" text;
  UPDATE "Books" SET "Genre" = CASE id
    WHEN 1 THEN 'scifi' WHEN 2 THEN 'romance' WHEN 4 THEN 'drama'
    WHEN 5 THEN 'drama' WHEN 6 THEN 'romance' END;`;

/** An imprint for each book with a publisher, to move to the publishers. */
const ADD_IMPRINTS = `ALTER TABLE "Books" ADD COLUMN "Imprint" text;
  UPDATE "Books" SET "Imprint" = CASE "Publisher"
    WHEN 1 THEN 'Ace Books' WHEN 2 THEN 'Penguin Classics'
    WHEN 3 THEN 'Vintage International' END;`;

/** The column names of a table in PostgreSQL, in order. */
async function storedColumns(schema: Schema, table: string): Promise<string[]> {
  const columns = await runSqlInSchema<{ name: string }>(
    schema,
    `SELECT attname AS name FROM pg_attribute
     WHERE attrelid = '"${table}"'::regclass AND attnum > 0 AND NOT attisdropped
     ORDER BY attnum`,
  );
  return columns.map((column) => column.name);
}

test.describe('extracting columns into a new table', () => {
  test.use({ allowedBrowserErrors: FORM_DESTROYED_TWICE });

  let tablePage: TablePage;
  let columnInspector: ColumnInspector;
  let form: ExtractColumnsModal;

  test.beforeEach(async ({ page, schema, library }) => {
    tablePage = new TablePage(page);
    columnInspector = new ColumnInspector(page, tablePage.inspector);
    form = new ExtractColumnsModal(page);
    await runSqlInSchema(schema, ADD_GENRES);
    await tablePage.goto(library.books);
    await tablePage.sheet.columnHeader('Genre').click();
    await columnInspector.extractButton.click();
    await expect(form.newTableName).toBeFocused();
  });

  test('moves the distinct values to the new table and links each record to its value', async ({
    page,
    schema,
  }) => {
    await expect(form.title).toHaveText('Extract Column Into a New Table');
    await expect(form.submitButton).toBeDisabled();
    await form.newTableName.fill('Genres');
    await expect(form.linkColumnName).toHaveValue('Genre');
    await form.submitButton.click();

    await new Toasts(page).expectMessage(
      'A new table Genres has been created with the extracted column',
    );
    await form.expectClosed();
    const { sheet } = tablePage;
    await expect(pickRecordButton(sheet.cell(0, 'Genre'))).toBeVisible();
    await expect(sheet.cell(0, 'Genre')).toHaveText('scifi');
    await expect(sheet.cell(4, 'Genre')).toHaveText('drama');
    expect(
      await runSqlInSchema(
        schema,
        `SELECT "Title", "Genres"."Genre" AS "Name" FROM "Books"
           JOIN "Genres" ON "Genres".id = "Books"."Genre"
         ORDER BY "Books".id`,
      ),
    ).toEqual([
      { Title: 'Dune', Name: 'scifi' },
      { Title: 'Emma', Name: 'romance' },
      { Title: 'Ulysses', Name: null },
      { Title: 'Beloved', Name: 'drama' },
      { Title: 'Hamlet', Name: 'drama' },
      { Title: 'Persuasion', Name: 'romance' },
    ]);
    expect(await storedColumns(schema, 'Genres')).toEqual(['id', 'Genre']);
    expect(
      await runSqlInSchema(
        schema,
        'SELECT "Genre" FROM "Genres" ORDER BY "Genre"',
      ),
    ).toEqual([
      { Genre: 'drama' },
      { Genre: 'romance' },
      { Genre: 'scifi' },
      { Genre: null },
    ]);
    expect(await foreignKeys(schema)).toContainEqual({
      name: 'Books_Genre 1_fkey',
      from: 'Books.Genre',
      to: 'Genres.id',
    });
  });

  test('links a record without a value to a new record without a value, shown by its id', async ({
    schema,
  }) => {
    await form.newTableName.fill('Genres');
    await form.submitButton.click();
    await form.expectClosed();

    const [empty] = await runSqlInSchema<{ id: number }>(
      schema,
      `SELECT id FROM "Genres" WHERE "Genre" IS NULL`,
    );
    await expect(tablePage.sheet.cell(2, 'Genre')).toHaveText(
      String(empty?.id),
    );
  });

  test('selects the new link column, with the focus on its first cell', async ({
    page,
  }) => {
    // The focus stays only when the table reloads after the form has faded out.
    const releaseRecords = await holdRpcCalls(page, 'records.list');
    await form.newTableName.fill('Genres');
    await form.submitButton.click();
    await form.expectClosed();
    releaseRecords();

    const { sheet } = tablePage;
    await expect(columnInspector.linkedTable).toHaveText('Genres');
    await expect(pickRecordButton(sheet.activeCell)).toBeVisible();
    await expect(sheet.activeCell).toHaveText('scifi');
    await expect(sheet.selectedCells).toHaveCount(6);
    await sheet.expectFocusOnActiveCell();
  });

  test(
    'gives the focus back to the Extract button when the table reloads before the form has faded out',
    pinsKnownBug('extract-new-column-focus'),
    async ({ page }) => {
      await form.newTableName.fill('Genres');
      await page.clock.install();
      await pauseClock(page);
      await form.submitButton.click();
      // The table has reloaded. The stopped clock keeps the form on the page.
      await tablePage.sheet.expectFocusOnActiveCell();
      await page.clock.runFor(1000);

      await form.expectClosed();
      await expect(columnInspector.extractButton).toBeFocused();
    },
  );

  test.fixme('keeps the focus on the first cell of the link column when the table reloads before the form has faded out', async ({
    page,
  }) => {
    await form.newTableName.fill('Genres');
    await page.clock.install();
    await pauseClock(page);
    await form.submitButton.click();
    await tablePage.sheet.expectFocusOnActiveCell();
    await page.clock.runFor(1000);

    await form.expectClosed();
    await tablePage.sheet.expectFocusOnActiveCell();
  });

  test('takes the columns chosen in the form, which it also selects in the sheet', async ({
    schema,
  }) => {
    await form.columns.toggle('Pages');
    await expect(form.title).toHaveText('Extract Columns Into a New Table');
    await expect(tablePage.sheet.selectedCells).toHaveCount(12);
    await form.newTableName.fill('Editions');
    await form.linkColumnName.fill('Edition');
    await form.submitButton.click();

    await form.expectClosed();
    await expect(tablePage.sheet.columnHeader('Edition')).toBeVisible();
    expect(await storedColumns(schema, 'Editions')).toEqual([
      'id',
      'Pages',
      'Genre',
    ]);
    expect(await storedColumns(schema, 'Books')).toEqual([
      'id',
      'Title',
      'Author',
      'Publisher',
      'Edition',
    ]);
  });

  test.describe('with no uncaught error allowed', () => {
    test.use({ allowedBrowserErrors: undefined });

    test('refuses names that exist, and Cancel changes nothing', async ({
      schema,
    }) => {
      await form.newTableName.fill('Authors');
      await expect(form.body).toContainText(
        'A table with that name already exists.',
      );
      await form.newTableName.fill('Genres');
      await form.linkColumnName.fill('Title');
      await expect(form.body).toContainText(
        'A column with that name already exists',
      );
      await expect(form.submitButton).toBeDisabled();
      await form.cancelButton.click();

      await form.expectClosed();
      expect(await storedColumns(schema, 'Books')).toContain('Genre');
    });

    test.fixme('the form fades out without an error, also when the table reloads meanwhile', async () => {
      await form.newTableName.fill('Genres');
      await form.submitButton.click();

      await form.expectClosed();
      await expect(
        pickRecordButton(tablePage.sheet.cell(0, 'Genre')),
      ).toBeVisible();
    });
  });
});

test.describe('moving columns to a linked table', () => {
  test.use({ allowedBrowserErrors: FORM_DESTROYED_TWICE });

  let tablePage: TablePage;
  let columnInspector: ColumnInspector;
  let form: ExtractColumnsModal;

  test.beforeEach(async ({ page, schema, library }) => {
    tablePage = new TablePage(page);
    columnInspector = new ColumnInspector(page, tablePage.inspector);
    form = new ExtractColumnsModal(page);
    await runSqlInSchema(schema, ADD_IMPRINTS);
    await tablePage.goto(library.books);
  });

  test('moves the values of a column to the records that the books link to', async ({
    page,
    schema,
  }) => {
    await tablePage.sheet.columnHeader('Imprint').click();
    await columnInspector.moveButton.click();
    await expect(form.linkedTable).toHaveText('Authors via Author');
    await chooseOption(form.linkedTable, 'Publishers via Publisher');
    await form.submitButton.click();

    await new Toasts(page).expectMessage(
      'Column Imprint has been moved to table Publishers',
    );
    await form.expectClosed();
    await expect(tablePage.sheet.columnHeader('Imprint')).toHaveCount(0);
    await expect(columnInspector.noSelectionNote).toBeVisible();
    expect(
      await runSqlInSchema(
        schema,
        'SELECT "Name", "Imprint" FROM "Publishers" ORDER BY id',
      ),
    ).toEqual([
      { Name: 'Ace', Imprint: 'Ace Books' },
      { Name: 'Penguin', Imprint: 'Penguin Classics' },
      { Name: 'Vintage', Imprint: 'Vintage International' },
    ]);
    expect(await storedColumns(schema, 'Books')).not.toContain('Imprint');
  });

  test.describe('with no uncaught error allowed', () => {
    test.use({ allowedBrowserErrors: undefined });

    test('refuses to move the linking column or the primary key', async () => {
      await tablePage.sheet.columnHeader('Publisher').click();
      await columnInspector.moveButton.click();
      await chooseOption(form.linkedTable, 'Publishers via Publisher');

      await expect(form.body).toContainText(
        'Cannot move linking column "Publisher" to its linked table "Publishers".',
      );
      await expect(form.submitButton).toBeDisabled();
      await form.columns.removeButton('Publisher').click();
      await form.columns.toggle('id');
      await expect(form.body).toContainText(
        'The primary key column cannot be moved.',
      );
      await expect(form.submitButton).toBeDisabled();
    });

    test('is not offered for a table without a linking column', async ({
      library,
    }) => {
      await tablePage.goto(library.tags);
      await tablePage.sheet.columnHeader('Label').click();

      await expect(columnInspector.extractButton).toBeVisible();
      await expect(columnInspector.moveButton).toHaveCount(0);
    });
  });
});

test.describe('a sort or a grouping by a column that moves to another table', () => {
  test.use({ allowedBrowserErrors: FORM_DESTROYED_TWICE });

  let tablePage: TablePage;
  let columnInspector: ColumnInspector;
  let form: ExtractColumnsModal;

  test.beforeEach(({ page }) => {
    tablePage = new TablePage(page);
    columnInspector = new ColumnInspector(page, tablePage.inspector);
    form = new ExtractColumnsModal(page);
  });

  test('a sort by an extracted column becomes a sort by its link column, in the same direction', async ({
    page,
    schema,
    library,
  }) => {
    await runSqlInSchema(schema, ADD_GENRES);
    await tablePage.goto(library.books);
    const { sheet } = tablePage;
    await sheet.columnHeader('Genre').click({ button: 'right' });
    await menuItem(page, 'Sort Z-A').click();
    await expect(sheet.cell(sheet.recordRows, 'Title')).toHaveText([
      'Ulysses',
      'Dune',
      'Emma',
      'Persuasion',
      'Beloved',
      'Hamlet',
    ]);
    await tablePage.inspector.tab('Column').click();
    await columnInspector.extractButton.click();
    await form.newTableName.fill('Genres');
    await form.linkColumnName.fill('Kind');
    await form.submitButton.click();
    await form.expectClosed();
    await tablePage.expectLoaded();

    await expect(
      columnIndicator(sheet, 'Kind', 'sorted descending'),
    ).toBeVisible();
    const byKindDescending = await runSqlInSchema<{ Title: string }>(
      schema,
      'SELECT "Title" FROM "Books" ORDER BY "Kind" DESC, id',
    );
    await expect(sheet.cell(sheet.recordRows, 'Title')).toHaveText(
      byKindDescending.map((book) => book.Title),
    );
  });

  test('a grouping by a moved column becomes a grouping by the column that links to its new table', async ({
    page,
    schema,
    library,
  }) => {
    await runSqlInSchema(schema, ADD_IMPRINTS);
    await tablePage.goto(library.books);
    const { sheet } = tablePage;
    await sheet.columnHeader('Imprint').click({ button: 'right' });
    await menuItem(page, 'Group by Column').click();
    await expect(sheet.groupHeaders).toHaveText([
      'Imprint Ace Books 1',
      'Imprint Penguin Classics 2',
      'Imprint Vintage International 1',
      'Imprint NULL 2',
    ]);
    await tablePage.inspector.tab('Column').click();
    await columnInspector.moveButton.click();
    await chooseOption(form.linkedTable, 'Publishers via Publisher');
    await form.submitButton.click();

    await expect(sheet.groupHeaders).toHaveText([
      'Publisher Ace 1',
      'Publisher Penguin 2',
      'Publisher Vintage 1',
      'Publisher NULL 2',
    ]);
    await expect(columnIndicator(sheet, 'Publisher', 'grouped')).toBeVisible();
  });
});
