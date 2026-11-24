import { type Schema, runSqlInSchema } from '../../support/api/mathesar';
import { holdRpcCalls } from '../../support/held-requests';
import { pinsKnownBug } from '../../support/known-bugs';
import { columnMenuItem } from '../../support/ui/components/column-options';
import { Modal } from '../../support/ui/components/modal';
import { Toasts } from '../../support/ui/components/toast';
import { tooltip } from '../../support/ui/components/tooltip';
import {
  RecordModal,
  RecordPage,
  type RelatedRecords,
} from '../../support/ui/pages/record-page';
import { tableUrl } from '../../support/ui/urls';
import { expect, test } from '../relationships/library';

/** The titles of the books of Penguin, the second publisher, in the order of their ids. */
async function storedTitlesOfPenguin(schema: Schema): Promise<string[]> {
  const books = await runSqlInSchema<{ Title: string }>(
    schema,
    'SELECT "Title" FROM "Books" WHERE "Publisher" = 2 ORDER BY id',
  );
  return books.map((book) => book.Title);
}

test.describe('the records that link to a record', () => {
  let recordPage: RecordPage;
  let authors: RelatedRecords;
  let books: RelatedRecords;

  test.beforeEach(async ({ page, library }) => {
    recordPage = new RecordPage(page);
    authors = recordPage.relatedRecords('Authors');
    books = recordPage.relatedRecords('Books');
    await recordPage.goto(library.publishers, 2);
    // A widget loads its records a second time after their count shows, and
    // a record added meanwhile shows twice.
    await expect(authors.refreshButton).toBeVisible();
    await expect(books.refreshButton).toBeVisible();
  });

  test('show the linking records without the linking column', async () => {
    await expect(books.sheet.columnHeaders).toHaveText([
      'id',
      'Title',
      'Author',
      'Pages',
    ]);
    await expect(books.sheet.cell(0, 'Title')).toHaveText('Emma');
    await expect(books.sheet.cell(1, 'Title')).toHaveText('Persuasion');
    await expect(authors.sheet.cell(0, 'Name')).toHaveText('Jane Austen');
  });

  test('the help of a heading names the table, the record and the linking column', async ({
    page,
  }) => {
    await books.help.hover();

    await expect(tooltip(page)).toHaveText(
      'These Books records link to Penguin via the Publisher column.',
    );
  });

  test('a value typed into the empty last row adds a record that links to the record', async ({
    schema,
  }) => {
    await books.sheet.editCell(
      books.sheet.placeholderCell('Title'),
      'Sanditon',
    );

    await expect(books.sheet.cell(2, 'Title')).toHaveText('Sanditon');
    await expect(books.sheet.cell(2, 'id')).toHaveText('7');
    await expect
      .poll(() =>
        runSqlInSchema(
          schema,
          `SELECT "Publisher" FROM "Books" WHERE "Title" = 'Sanditon'`,
        ),
      )
      .toEqual([{ Publisher: 2 }]);
  });

  test('each table keeps its own active cell and the keys move the one that has the focus', async ({
    page,
  }) => {
    await authors.sheet.cell(0, 'Name').click();
    await books.sheet.cell(0, 'Title').click();
    await books.sheet.expectFocusOnActiveCell();
    await page.keyboard.press('ArrowDown');

    await expect(books.sheet.activeCell).toHaveText('Persuasion');
    await expect(authors.sheet.activeCell).toHaveText('Jane Austen');
  });

  test('a cell copied in one table is pasted into the table that has the focus', async ({
    page,
    schema,
  }) => {
    await authors.sheet.cell(0, 'Name').click();
    await page.keyboard.press('Control+c');
    await new Toasts(page).expectMessage('Copied 1 cell');
    // A paste into the wrong table would land on this cell.
    await page.keyboard.press('ArrowRight');
    await books.sheet.cell(0, 'Title').click();
    await page.keyboard.press('Control+v');
    await new Modal(page, 'Paste 1 cell?').button('Paste').click();

    await expect(books.sheet.cell(0, 'Title')).toHaveText('Jane Austen');
    await expect(authors.sheet.cell(0, 'Country')).toHaveText('UK');
    await expect
      .poll(() => storedTitlesOfPenguin(schema))
      .toEqual(['Jane Austen', 'Persuasion']);
    expect(
      await runSqlInSchema(
        schema,
        'SELECT "Name", "Country" FROM "Authors" WHERE id = 2',
      ),
    ).toEqual([{ Name: 'Jane Austen', Country: 'UK' }]);
  });

  test('a sort orders the records of its own table only', async ({ page }) => {
    await books.sortButton.click();
    await columnMenuItem(page, 'Pages').click();

    await expect(books.sheet.cell(0, 'Title')).toHaveText('Persuasion');
    await expect(books.sheet.cell(1, 'Title')).toHaveText('Emma');
    await expect(books.sortButton).toHaveText('Sort 1');
    await expect(authors.sortButton).toHaveText('Sort');
  });

  test.describe('a record typed into the empty last row while a sort reloads the records', () => {
    test.beforeEach(async ({ page, schema }) => {
      const releaseRecords = await holdRpcCalls(page, 'records.list');
      await books.sortButton.click();
      await columnMenuItem(page, 'Pages').click();
      await page.keyboard.press('Escape');
      await expect(books.refreshButton).toHaveCount(0);
      await books.sheet.editCell(
        books.sheet.placeholderCell('Title'),
        'Sanditon',
      );
      await expect
        .poll(() => storedTitlesOfPenguin(schema))
        .toEqual(['Emma', 'Persuasion', 'Sanditon']);
      releaseRecords();
      await expect(books.refreshButton).toBeVisible();
    });

    test(
      'shows twice once they have loaded',
      pinsKnownBug('added-record-shown-twice'),
      async () => {
        await expect(books.sheet.recordRows).toHaveCount(4);
        await expect(books.sheet.rowContaining('Sanditon')).toHaveCount(2);
      },
    );

    test.fixme('shows once', async () => {
      await expect(books.sheet.recordRows).toHaveCount(3);
      await expect(books.sheet.rowContaining('Sanditon')).toHaveCount(1);
    });
  });

  test('the record link of a row opens that record in a modal', async ({
    page,
  }) => {
    await books.sheet.recordLink(1).click();

    const modal = new RecordModal(page, 'Persuasion');
    await expect(modal.view.field('Pages')).toHaveValue('250');
    await expect(modal.view.relatedRecordHeadings).toHaveText(['Books_Tags']);
  });
});

test('the records that link to a record come as one table per linking column, sorted by table name, under a heading that leads to the table', async ({
  page,
  api,
  schema,
  library,
}) => {
  // "Awards" is created after "Books", so the server lists it after "Books".
  await runSqlInSchema(
    schema,
    `CREATE TABLE "Awards" (
       id integer PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
       "Sponsor" integer REFERENCES "Publishers" (id)
     );
     INSERT INTO "Awards" ("Sponsor") VALUES (2);
     ALTER TABLE "Books" ADD COLUMN "Printer" integer REFERENCES "Publishers" (id);
     UPDATE "Books" SET "Printer" = 2 WHERE id = 1;`,
  );
  const recordPage = new RecordPage(page);
  await recordPage.goto(library.publishers, 2);

  await expect(recordPage.relatedRecordHeadings).toHaveText([
    'Authors',
    'Awards',
    'Books',
    'Books',
  ]);
  await expect(recordPage.relatedRecords('Books').recordCount).toHaveText([
    'Showing 1–2 of 2',
    'Showing 1–1 of 1',
  ]);
  await expect(recordPage.relatedRecords('Awards').tableLink).toHaveAttribute(
    'href',
    tableUrl(await api.getTable(schema, 'Awards')),
  );
});

test('only the tables that link to a record are listed, not those it links to', async ({
  page,
  library,
}) => {
  const recordPage = new RecordPage(page);
  await recordPage.goto(library.authors, 2);

  await expect(recordPage.relatedRecordHeadings).toHaveText(['Books']);
  await expect(recordPage.relatedRecords('Books').recordCount).toHaveText(
    'Showing 1–2 of 2',
  );
});

test('ten linking records show at a time', async ({
  page,
  schema,
  library,
}) => {
  await runSqlInSchema(
    schema,
    `INSERT INTO "Books" ("Title", "Publisher")
       SELECT 'Volume ' || n, 3 FROM generate_series(1, 11) AS n`,
  );
  const recordPage = new RecordPage(page);
  await recordPage.goto(library.publishers, 3);
  const books = recordPage.relatedRecords('Books');

  await expect(books.recordCount).toHaveText('Showing 1–10 of 12');
  await expect(books.sheet.recordRows).toHaveCount(10);
});
