import { type Schema, runSqlInSchema } from '../../support/api/mathesar';
import { pinsKnownBug } from '../../support/known-bugs';
import {
  readClipboardText,
  writeClipboardText,
  writeMathesarClipboard,
} from '../../support/ui/clipboard';
import { menuItem } from '../../support/ui/components/menu';
import { Modal } from '../../support/ui/components/modal';
import { Toasts } from '../../support/ui/components/toast';
import { ExtendDropdown } from '../../support/ui/pages/extend-dropdown';
import { TablePage } from '../../support/ui/pages/table-page';
import { expect, storedBooks, test } from './books';

interface DatesOfDune {
  Published: string | null;
  Launch: string | null;
}

/** The date columns that the tests of date formats add, as PostgreSQL prints them. */
async function storedDatesOfDune(
  schema: Schema,
): Promise<DatesOfDune | undefined> {
  const [dune] = await runSqlInSchema<DatesOfDune>(
    schema,
    `SELECT "Published"::text AS "Published", "Launch"::text AS "Launch"
     FROM "Books" WHERE id = 1`,
  );
  return dune;
}

test.describe('copying cells', () => {
  test('Control+C copies the selection as tab-separated text, with NULL as empty', async ({
    page,
    tablePage: { sheet },
  }) => {
    await sheet.cell(3, 'Author').click();
    await sheet.cell(4, 'Pages').click({ modifiers: ['Shift'] });
    await page.keyboard.press('Control+c');

    await new Toasts(page).expectMessage('Copied 4 cells');
    expect(await readClipboardText(page)).toBe('Toni Morrison\t324\r\n\t');
  });

  test('the context menu copies the cell it was opened on', async ({
    page,
    tablePage: { sheet },
  }) => {
    await sheet.cell(0, 'Title').click({ button: 'right' });
    await menuItem(page, 'Copy').click();

    await new Toasts(page).expectMessage('Copied 1 cell');
    expect(await readClipboardText(page)).toBe('Dune');
  });

  test('copying inside an open editor copies only the selected text', async ({
    page,
    tablePage: { sheet },
  }) => {
    await sheet.cell(1, 'Author').dblclick();
    await page.keyboard.press('End');
    await page.keyboard.press('Shift+Control+ArrowLeft');
    await page.keyboard.press('Control+c');

    await expect(sheet.editor).toBeFocused();
    expect(await readClipboardText(page)).toBe('Austen');
    await expect(new Toasts(page).items).toHaveCount(0);
  });

  test('escapes a value that starts with =, +, @ or - with an apostrophe, but not a negative number', async ({
    page,
    schema,
    books,
  }) => {
    await runSqlInSchema(
      schema,
      `UPDATE "Books" SET "Author" = '=1+1', "Pages" = -5 WHERE id = 1;
       UPDATE "Books" SET "Author" = '+x' WHERE id = 2;
       UPDATE "Books" SET "Author" = '@y' WHERE id = 3;
       UPDATE "Books" SET "Author" = '-x' WHERE id = 4;`,
    );
    const tablePage = new TablePage(page);
    await tablePage.goto(books);
    const { sheet } = tablePage;
    await sheet.cell(0, 'Author').click();
    await sheet.cell(3, 'Pages').click({ modifiers: ['Shift'] });
    await page.keyboard.press('Control+c');

    await new Toasts(page).expectMessage('Copied 8 cells');
    expect(await readClipboardText(page)).toBe(
      `"'=1+1"\t-5\r\n"'+x"\t320\r\n"'@y"\t730\r\n"'-x"\t324`,
    );
  });

  test(
    'escapes a negative number that is shown with a thousands separator',
    pinsKnownBug('copy-escapes-negative-number-with-separator'),
    async ({ page, schema, books }) => {
      await runSqlInSchema(
        schema,
        'UPDATE "Books" SET "Pages" = -1234 WHERE id = 1',
      );
      const tablePage = new TablePage(page);
      await tablePage.goto(books);
      await expect(tablePage.sheet.cell(0, 'Pages')).toHaveText('-1,234');
      await tablePage.sheet.cell(0, 'Pages').click();
      await page.keyboard.press('Control+c');

      await new Toasts(page).expectMessage('Copied 1 cell');
      expect(await readClipboardText(page)).toBe(`"'-1,234"`);
    },
  );

  test.fixme('copies a negative number with a thousands separator as it is shown', async ({
    page,
    schema,
    books,
  }) => {
    await runSqlInSchema(
      schema,
      'UPDATE "Books" SET "Pages" = -1234 WHERE id = 1',
    );
    const tablePage = new TablePage(page);
    await tablePage.goto(books);
    await tablePage.sheet.cell(0, 'Pages').click();
    await page.keyboard.press('Control+c');

    await new Toasts(page).expectMessage('Copied 1 cell');
    expect(await readClipboardText(page)).toBe('-1,234');
  });
});

test.describe('the clipboard outside of the sheet cells', () => {
  test('Control+C copies the cell of a context menu that was closed with Escape', async ({
    page,
    tablePage: { sheet },
  }) => {
    await sheet.cell(0, 'Title').click();
    await sheet.cell(2, 'Author').click({ button: 'right' });
    await page.keyboard.press('Escape');
    await page.keyboard.press('Control+c');

    await new Toasts(page).expectMessage('Copied 1 cell');
    expect(await readClipboardText(page)).toBe('James Joyce');
  });

  test('a paste into a field of the inspector goes into that field', async ({
    page,
    tablePage,
  }) => {
    await writeClipboardText(page, 'Novels');
    const tableName = tablePage.inspector.panel.getByRole('textbox').first();
    await tableName.click();
    await page.keyboard.press('Control+a');
    await page.keyboard.press('Control+v');

    await expect(tableName).toHaveValue('Novels');
    await expect(new Modal(page, /^Paste/).root).toHaveCount(0);
  });
});

test.describe('pasting into cells', () => {
  test('a copied cell is pasted into another cell after confirmation', async ({
    page,
    schema,
    tablePage: { sheet },
  }) => {
    await sheet.cell(0, 'Author').click();
    await page.keyboard.press('Control+c');
    await sheet.cell(1, 'Author').click();
    await page.keyboard.press('Control+v');

    const confirmation = new Modal(page, 'Paste 1 cell?');
    await confirmation.expectOpen();
    expect((await storedBooks(schema))[1]?.Author).toBe('Jane Austen');

    await confirmation.button('Paste').click();
    await confirmation.expectClosed();
    await expect(sheet.cell(1, 'Author')).toHaveText('Frank Herbert');
    await sheet.expectFocusOnActiveCell();
    await expect
      .poll(async () => (await storedBooks(schema))[1]?.Author)
      .toBe('Frank Herbert');
  });

  test('a copied NULL is pasted as NULL', async ({
    page,
    schema,
    tablePage: { sheet },
  }) => {
    await sheet.cell(4, 'Author').click();
    await page.keyboard.press('Control+c');
    await new Toasts(page).expectMessage('Copied 1 cell');
    await sheet.cell(0, 'Author').click();
    await page.keyboard.press('Control+v');
    await new Modal(page, 'Paste 1 cell?').button('Paste').click();

    await expect(sheet.cell(0, 'Author')).toHaveText('NULL');
    await expect
      .poll(async () => (await storedBooks(schema))[0]?.Author)
      .toBeNull();
  });

  test('a copied value that starts with = is pasted without the apostrophe of the copied text', async ({
    page,
    schema,
    books,
  }) => {
    await runSqlInSchema(
      schema,
      `UPDATE "Books" SET "Author" = '=1+1' WHERE id = 1`,
    );
    const tablePage = new TablePage(page);
    await tablePage.goto(books);
    const { sheet } = tablePage;
    await sheet.cell(0, 'Author').click();
    await page.keyboard.press('Control+c');
    await new Toasts(page).expectMessage('Copied 1 cell');
    await sheet.cell(1, 'Author').click();
    await page.keyboard.press('Control+v');
    await new Modal(page, 'Paste 1 cell?').button('Paste').click();

    await expect(sheet.cell(1, 'Author')).toHaveText('=1+1');
    await expect
      .poll(async () => (await storedBooks(schema))[1]?.Author)
      .toBe('=1+1');
  });

  test('several rows copied in Mathesar are pasted with their stored values, not their shown text', async ({
    page,
    schema,
    books,
  }) => {
    // Pasted as text, "1,412" would not fit the integer column.
    await runSqlInSchema(
      schema,
      'UPDATE "Books" SET "Pages" = 1412 WHERE id = 1',
    );
    const tablePage = new TablePage(page);
    await tablePage.goto(books);
    const { sheet } = tablePage;
    await sheet.cell(0, 'Title').click();
    await sheet.cell(1, 'Pages').click({ modifiers: ['Shift'] });
    await page.keyboard.press('Control+c');
    await new Toasts(page).expectMessage('Copied 6 cells');
    await sheet.cell(3, 'Title').click();
    await page.keyboard.press('Control+v');
    await new Modal(page, 'Paste 6 cells?').button('Paste').click();

    await expect(sheet.selectedCells).toHaveText([
      'Dune',
      'Frank Herbert',
      '1,412',
      'Emma',
      'Jane Austen',
      '320',
    ]);
    await expect
      .poll(async () =>
        (await storedBooks(schema))
          .slice(3)
          .map(({ Title, Author, Pages }) => [Title, Author, Pages]),
      )
      .toEqual([
        ['Dune', 'Frank Herbert', 1412],
        ['Emma', 'Jane Austen', 320],
      ]);
  });

  test('Mathesar data of an unknown shape is pasted as its plain text', async ({
    page,
    schema,
    tablePage: { sheet },
  }) => {
    await writeMathesarClipboard(
      page,
      [[{ type: 'text', value: 'from another version' }]],
      'Ann',
    );
    await sheet.cell(1, 'Author').click();
    await page.keyboard.press('Control+v');
    await new Modal(page, 'Paste 1 cell?').button('Paste').click();

    await expect(sheet.cell(1, 'Author')).toHaveText('Ann');
    await expect
      .poll(async () => (await storedBooks(schema))[1]?.Author)
      .toBe('Ann');
  });

  test('an empty field of pasted text becomes NULL in a nullable column and an empty text in a required one', async ({
    page,
    schema,
    tablePage: { sheet },
  }) => {
    await writeClipboardText(page, 'Dune II\t\n\tAusten');
    await sheet.cell(0, 'Title').click();
    await page.keyboard.press('Control+v');
    await new Modal(page, 'Paste 4 cells?').button('Paste').click();

    await expect(sheet.selectedCells).toHaveText([
      'Dune II',
      'NULL',
      '',
      'Austen',
    ]);
    await expect
      .poll(async () =>
        (await storedBooks(schema))
          .slice(0, 2)
          .map(({ Title, Author }) => [Title, Author]),
      )
      .toEqual([
        ['Dune II', null],
        ['', 'Austen'],
      ]);
  });

  test(
    'pasted text that starts with an empty field is pasted from its second field on',
    pinsKnownBug('paste-drops-leading-empty-field'),
    async ({ page, schema, tablePage: { sheet } }) => {
      await writeClipboardText(page, '\t999');
      await sheet.cell(1, 'Author').click();
      await page.keyboard.press('Control+v');
      await new Modal(page, 'Paste 1 cell?').button('Paste').click();

      await expect(sheet.cell(1, 'Author')).toHaveText('999');
      await expect
        .poll(async () => {
          const emma = (await storedBooks(schema))[1];
          return [emma?.Author, emma?.Pages];
        })
        .toEqual(['999', 320]);
    },
  );

  test.fixme('pasted text that starts with an empty field keeps each value in its column', async ({
    page,
    schema,
    tablePage: { sheet },
  }) => {
    await writeClipboardText(page, '\t999');
    await sheet.cell(1, 'Author').click();
    await page.keyboard.press('Control+v');
    await new Modal(page, 'Paste 2 cells?').button('Paste').click();

    await expect(sheet.selectedCells).toHaveText(['NULL', '999']);
    await expect
      .poll(async () => {
        const emma = (await storedBooks(schema))[1];
        return [emma?.Author, emma?.Pages];
      })
      .toEqual([null, 999]);
  });

  test('cancelling the confirmation pastes nothing', async ({
    page,
    schema,
    tablePage: { sheet },
  }) => {
    await writeClipboardText(page, 'unwanted');
    await sheet.cell(1, 'Author').click();
    await page.keyboard.press('Control+v');
    const confirmation = new Modal(page, 'Paste 1 cell?');
    await confirmation.button('Cancel').click();

    await confirmation.expectClosed();
    await expect(sheet.cell(1, 'Author')).toHaveText('Jane Austen');
    expect((await storedBooks(schema))[1]?.Author).toBe('Jane Austen');
  });

  test('tab-separated text from elsewhere fills a block and selects it', async ({
    page,
    schema,
    tablePage: { sheet },
  }) => {
    await writeClipboardText(page, 'Ann\t11\nBob\t22');
    await sheet.cell(2, 'Author').click();
    await page.keyboard.press('Control+v');
    await new Modal(page, 'Paste 4 cells?').button('Paste').click();

    await expect(sheet.selectedCells).toHaveText(['Ann', '11', 'Bob', '22']);
    await expect(sheet.activeCell).toHaveText('Ann');
    await expect
      .poll(async () =>
        (await storedBooks(schema))
          .slice(2, 4)
          .map(({ Author, Pages }) => [Author, Pages]),
      )
      .toEqual([
        ['Ann', 11],
        ['Bob', 22],
      ]);
  });

  test('one copied value fills every selected cell of a column', async ({
    page,
    schema,
    tablePage: { sheet },
  }) => {
    await writeClipboardText(page, 'same');
    await sheet.cell(0, 'Notes').click();
    await sheet.cell(2, 'Notes').click({ modifiers: ['Shift'] });
    await page.keyboard.press('Control+v');
    await new Modal(page, 'Paste 3 cells?').button('Paste').click();

    await expect(sheet.selectedCells).toHaveText(['same', 'same', 'same']);
    await expect
      .poll(async () => (await storedBooks(schema)).map(({ Notes }) => Notes))
      .toEqual(['same', 'same', 'same', 'd', 'e']);
  });

  test('rows pasted past the last record are added as new records', async ({
    page,
    schema,
    tablePage: { sheet },
  }) => {
    await writeClipboardText(page, 'Kindred\nPersuasion\nMiddlemarch');
    await sheet.cell(4, 'Title').click();
    await page.keyboard.press('Control+v');
    await new Modal(page, 'Paste 3 cells?').button('Paste').click();

    await expect(sheet.recordRows).toHaveCount(7);
    await expect(sheet.newRecordsNote).toBeVisible();
    await expect(sheet.selectedCells).toHaveText([
      'Kindred',
      'Persuasion',
      'Middlemarch',
    ]);
    await expect
      .poll(async () =>
        (await storedBooks(schema))
          .slice(4)
          .map(({ Title, Notes }) => [Title, Notes]),
      )
      .toEqual([
        ['Kindred', 'e'],
        ['Persuasion', 'none'],
        ['Middlemarch', 'none'],
      ]);
  });

  test('a paste into the empty last row adds a record without asking', async ({
    page,
    schema,
    tablePage: { sheet },
  }) => {
    await writeClipboardText(page, 'Kindred\tOctavia Butler');
    await sheet.placeholderCell('Title').click();
    await page.keyboard.press('Control+v');

    await expect(sheet.selectedCells).toHaveText(['Kindred', 'Octavia Butler']);
    await expect(sheet.recordRows).toHaveCount(6);
    await expect
      .poll(async () => (await storedBooks(schema)).at(-1))
      .toMatchObject({ Title: 'Kindred', Author: 'Octavia Butler' });
  });

  test('the context menu pastes into the cell it was opened on', async ({
    page,
    schema,
    tablePage: { sheet },
  }) => {
    await writeClipboardText(page, 'from the menu');
    await sheet.cell(3, 'Author').click({ button: 'right' });
    await menuItem(page, 'Paste').click();
    await new Modal(page, 'Paste 1 cell?').button('Paste').click();

    await expect(sheet.cell(3, 'Author')).toHaveText('from the menu');
    await expect
      .poll(async () => (await storedBooks(schema))[3]?.Author)
      .toBe('from the menu');
  });
});

test.describe('pasting text into date columns with a day-first format', () => {
  let tablePage: TablePage;

  test.beforeEach(async ({ page, api, books }) => {
    await runSqlInSchema(
      books.schema,
      'ALTER TABLE "Books" ADD COLUMN "Published" date, ADD COLUMN "Launch" timestamp',
    );
    const table = await api.getTable(books.schema, 'Books');
    await api.setColumnMetadata(table, 'Published', { date_format: 'eu' });
    await api.setColumnMetadata(table, 'Launch', { date_format: 'eu' });
    tablePage = new TablePage(page);
    await tablePage.goto(table);
  });

  test('reads a date day first', async ({ page, schema }) => {
    const { sheet } = tablePage;
    await writeClipboardText(page, '03/04/2024');
    await sheet.cell(0, 'Published').click();
    await page.keyboard.press('Control+v');
    await new Modal(page, 'Paste 1 cell?').button('Paste').click();

    await expect(sheet.cell(0, 'Published')).toHaveText('03/04/2024');
    await expect
      .poll(() => storedDatesOfDune(schema))
      .toEqual({ Published: '2024-04-03', Launch: null });
  });

  test(
    'reads a date and time month first',
    pinsKnownBug('paste-date-time-ignores-date-format'),
    async ({ page, schema }) => {
      const { sheet } = tablePage;
      await writeClipboardText(page, '03/04/2024 13:45');
      await sheet.cell(0, 'Launch').click();
      await page.keyboard.press('Control+v');
      await new Modal(page, 'Paste 1 cell?').button('Paste').click();

      await expect(sheet.cell(0, 'Launch')).toHaveText('04/03/2024 13:45');
      await expect
        .poll(() => storedDatesOfDune(schema))
        .toEqual({ Published: null, Launch: '2024-03-04 13:45:00' });
    },
  );

  test.fixme('reads a date and time day first', async ({ page, schema }) => {
    const { sheet } = tablePage;
    await writeClipboardText(page, '03/04/2024 13:45');
    await sheet.cell(0, 'Launch').click();
    await page.keyboard.press('Control+v');
    await new Modal(page, 'Paste 1 cell?').button('Paste').click();

    await expect(sheet.cell(0, 'Launch')).toHaveText('03/04/2024 13:45');
    await expect
      .poll(() => storedDatesOfDune(schema))
      .toEqual({ Published: null, Launch: '2024-04-03 13:45:00' });
  });
});

test.describe('a paste that cannot be applied', () => {
  test('is refused when the data has more columns than remain in the table', async ({
    page,
    schema,
    tablePage: { sheet },
  }) => {
    await writeClipboardText(page, 'a\tb\tc');
    await sheet.cell(0, 'Notes').click();
    await page.keyboard.press('Control+v');

    await new Toasts(page).expectMessage(
      'The table does not contain enough columns to paste the copied data at your selection.',
    );
    expect((await storedBooks(schema))[0]?.Notes).toBe('a');
  });

  test('is refused when the selection has more columns than the data', async ({
    page,
    schema,
    tablePage: { sheet },
  }) => {
    await writeClipboardText(page, 'single');
    await sheet.cell(0, 'Author').click();
    await sheet.cell(0, 'Code').click({ modifiers: ['Shift'] });
    await page.keyboard.press('Control+v');

    await new Toasts(page).expectMessage(
      'Cannot paste into a selection which has more columns than the copied data.',
    );
    expect((await storedBooks(schema))[0]?.Author).toBe('Frank Herbert');
  });

  test('is refused when the clipboard holds no text', async ({
    page,
    tablePage: { sheet },
  }) => {
    await writeClipboardText(page, '');
    await sheet.cell(0, 'Author').click();
    await page.keyboard.press('Control+v');

    await new Toasts(page).expectMessage(
      'Your copied data is not in a supported format.',
    );
  });

  test('is refused when the clipboard holds only a line break', async ({
    page,
    schema,
    tablePage: { sheet },
  }) => {
    await writeClipboardText(page, '\n');
    await sheet.cell(0, 'Author').click();
    await page.keyboard.press('Control+v');

    await new Toasts(page).expectMessage('No data to paste.');
    expect((await storedBooks(schema))[0]?.Author).toBe('Frank Herbert');
  });

  test('asks to select cells when the cell is in the empty last row of a joined column', async ({
    page,
    schema,
    books,
  }) => {
    await runSqlInSchema(
      schema,
      `CREATE TABLE "Tags" (
         id integer PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
         "Label" text
       );
       CREATE TABLE "Books_Tags" (
         id integer PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
         "Book" integer NOT NULL REFERENCES "Books" (id),
         "Tag" integer NOT NULL REFERENCES "Tags" (id)
       );`,
    );
    const tablePage = new TablePage(page);
    await tablePage.goto(books);
    const extend = new ExtendDropdown(page);
    await extend.trigger.click();
    await extend.relatedTable('Tags via Books_Tags').check();
    await extend.trigger.click();
    const { sheet } = tablePage;
    await writeClipboardText(page, 'classic');
    await sheet.placeholderCell('Tags').click();
    await page.keyboard.press('Control+v');

    await new Toasts(page).expectMessage(
      'You must select cells before pasting data.',
    );
    await expect(sheet.recordRows).toHaveCount(5);
    expect(await storedBooks(schema)).toHaveLength(5);
  });

  test('marks the cell with the database error when a value does not fit the column type', async ({
    page,
    schema,
    tablePage: { sheet },
  }) => {
    await writeClipboardText(page, 'not a number');
    await sheet.cell(0, 'Pages').click();
    await page.keyboard.press('Control+v');
    await new Modal(page, 'Paste 1 cell?').button('Paste').click();

    await expect(sheet.errorIndicator(sheet.cell(0, 'Pages'))).toBeVisible();
    await expect(sheet.cellErrors).toContainText(
      'invalid input syntax for type integer: "not a number"',
    );
    expect((await storedBooks(schema))[0]?.Pages).toBe(412);
  });

  test('cannot change the primary key of a saved record', async ({
    page,
    schema,
    tablePage: { sheet },
  }) => {
    await writeClipboardText(page, '99');
    await sheet.cell(0, 'id').click();
    await page.keyboard.press('Control+v');
    await new Modal(page, 'Paste 1 cell?').button('Paste').click();

    await new Toasts(page).expectMessage(
      'Unable to modify primary key cells of saved rows',
    );
    expect((await storedBooks(schema))[0]?.id).toBe(1);
  });
});
