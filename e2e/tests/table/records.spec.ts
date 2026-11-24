import { runSqlInSchema } from '../../support/api/mathesar';
import { pinsKnownBug } from '../../support/known-bugs';
import { recordRpcCalls } from '../../support/rpc-log';
import { menuItem } from '../../support/ui/components/menu';
import { Modal } from '../../support/ui/components/modal';
import { Toasts } from '../../support/ui/components/toast';
import { focusIsOnPage } from '../../support/ui/components/typed-cells';
import { TablePage } from '../../support/ui/pages/table-page';
import { expect, storedBooks, test } from './books';

test.describe('adding records', () => {
  test('New Record keeps the record unsaved while a required column is empty', async ({
    schema,
    tablePage,
  }) => {
    const { sheet } = tablePage;
    await tablePage.newRecordButton.click();

    await expect(sheet.recordRows).toHaveCount(6);
    await expect(sheet.newRecordsNote).toBeVisible();
    await expect(sheet.rowHeader(5)).toHaveText('6 *');
    await expect(sheet.cell(5, 'Title')).toHaveAttribute('data-cell-active');
    await sheet.expectFocusOnActiveCell();
    await expect(tablePage.recordCount).toContainText('+1 unsaved');
    expect(await storedBooks(schema)).toHaveLength(5);
  });

  test('marks the empty required cell of a new record, and its row number names the column on hover', async ({
    tablePage,
  }) => {
    const { sheet } = tablePage;
    await tablePage.newRecordButton.click();

    await expect(sheet.errorIndicator(sheet.cell(5, 'Title'))).toHaveText('*');
    await expect(sheet.errorIndicator(sheet.cell(5, 'Author'))).toHaveCount(0);
    await expect(sheet.cell(5, 'Title')).toHaveAttribute('data-cell-active');
    await expect(sheet.cellErrors).toHaveCount(0);
    await expect(sheet.errorIndicator(sheet.rowHeader(5))).toBeVisible();

    await sheet.rowHeader(5).hover();
    await expect(sheet.cellErrors).toHaveText([
      "The columns 'Title' cannot be NULL.",
    ]);
  });

  test('the unsaved record is stored once its required column is filled', async ({
    schema,
    tablePage,
  }) => {
    const { sheet } = tablePage;
    await tablePage.newRecordButton.click();
    await sheet.editCell(sheet.cell(5, 'Title'), 'Kindred');

    await expect(sheet.rowHeader(5)).toHaveText('6');
    await expect(sheet.cell(5, 'id')).toHaveText('6');
    await expect(sheet.cell(5, 'Notes')).toHaveText('none');
    await expect(tablePage.recordCount).toContainText('+1 new');
    await expect
      .poll(async () => (await storedBooks(schema)).at(-1))
      .toEqual({
        id: 6,
        Title: 'Kindred',
        Author: null,
        Pages: null,
        Code: null,
        Notes: 'none',
      });
  });

  test('New Record stores the record at once when no column is required', async ({
    page,
    schema,
    books,
  }) => {
    await runSqlInSchema(
      schema,
      'ALTER TABLE "Books" ALTER COLUMN "Title" DROP NOT NULL',
    );
    const tablePage = new TablePage(page);
    await tablePage.goto(books);
    await tablePage.newRecordButton.click();

    await expect(tablePage.sheet.rowHeader(5)).toHaveText('6');
    await expect(tablePage.sheet.cell(5, 'Notes')).toHaveText('none');
    await expect(tablePage.recordCount).toContainText('+1 new');
    await expect.poll(() => storedBooks(schema)).toHaveLength(6);
  });

  test('a second New Record adds another record below the first', async ({
    page,
    schema,
    books,
  }) => {
    await runSqlInSchema(
      schema,
      'ALTER TABLE "Books" ALTER COLUMN "Title" DROP NOT NULL',
    );
    const tablePage = new TablePage(page);
    await tablePage.goto(books);
    const { sheet } = tablePage;
    await tablePage.newRecordButton.click();
    await expect(sheet.rowHeader(5)).toHaveText('6');
    await tablePage.newRecordButton.click();

    await expect(sheet.rowHeader(6)).toHaveText('7');
    await expect(sheet.cell(5, 'id')).toHaveText('6');
    await expect(sheet.cell(6, 'id')).toHaveText('7');
    await expect(tablePage.recordCount).toContainText('+2 new');
    await expect
      .poll(async () => (await storedBooks(schema)).map(({ id }) => id))
      .toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  test('a value entered in the empty last row adds a record and a new empty row', async ({
    schema,
    tablePage: { sheet },
  }) => {
    await sheet.editCell(sheet.placeholderCell('Title'), 'Kindred');

    await expect(sheet.recordRows).toHaveCount(6);
    await expect(sheet.cell(5, 'Title')).toHaveText('Kindred');
    await expect(sheet.cell(5, 'Title')).toHaveAttribute('data-cell-active');
    await sheet.expectFocusOnActiveCell();
    await expect(sheet.placeholderRow).toHaveCount(1);
    await expect
      .poll(async () => (await storedBooks(schema)).at(-1)?.Title)
      .toBe('Kindred');
  });

  test('a click on the number cell of the empty last row starts a record', async ({
    tablePage,
  }) => {
    const { sheet } = tablePage;
    await sheet.rowHeader(sheet.placeholderRow).click();

    await expect(sheet.recordRows).toHaveCount(6);
    await expect(sheet.rowHeader(5)).toHaveText('6 *');
    await expect(sheet.cell(5, 'Title')).toHaveAttribute('data-cell-active');
  });

  test(
    'a click on the number cell of the empty last row leaves the keyboard focus on the sheet body',
    pinsKnownBug('sheet-new-record-from-row-number-focus'),
    async ({ page, browserName, tablePage: { sheet } }) => {
      test.skip(
        browserName !== 'chromium',
        'Firefox and WebKit leave the focus on the page, as the next test pins',
      );
      await sheet.rowHeader(sheet.placeholderRow).click();
      await expect(sheet.cell(5, 'Title')).toHaveAttribute('data-cell-active');

      await expect(sheet.body).toBeFocused();
      await page.keyboard.press('ArrowRight');
      await expect(sheet.cell(5, 'Title')).toHaveAttribute('data-cell-active');
    },
  );

  test(
    'a click on the number cell of the empty last row leaves the keyboard focus on the page',
    pinsKnownBug('sheet-new-record-from-row-number-focus'),
    async ({ page, browserName, tablePage: { sheet } }) => {
      test.skip(
        browserName === 'chromium',
        'Chromium leaves the focus on the sheet body, as the test before pins',
      );
      await sheet.rowHeader(sheet.placeholderRow).click();
      await expect(sheet.cell(5, 'Title')).toHaveAttribute('data-cell-active');

      await expect.poll(() => focusIsOnPage(page)).toBe(true);
      await page.keyboard.press('ArrowRight');
      await expect(sheet.cell(5, 'Title')).toHaveAttribute('data-cell-active');
    },
  );

  test.fixme('a click on the number cell of the empty last row gives the keyboard focus to the new cell', async ({
    page,
    tablePage: { sheet },
  }) => {
    await sheet.rowHeader(sheet.placeholderRow).click();
    await expect(sheet.cell(5, 'Title')).toHaveAttribute('data-cell-active');

    await sheet.expectFocusOnActiveCell();
    await page.keyboard.press('ArrowRight');
    await expect(sheet.cell(5, 'Author')).toHaveAttribute('data-cell-active');
  });

  test('Refresh keeps an added record, drops an unsaved one and the note about new records', async ({
    tablePage,
  }) => {
    const { sheet } = tablePage;
    await sheet.editCell(sheet.placeholderCell('Title'), 'Kindred');
    await expect(sheet.cell(5, 'Title')).toHaveText('Kindred');
    await tablePage.newRecordButton.click();
    await expect(sheet.recordRows).toHaveCount(7);
    await expect(sheet.newRecordsNote).toBeVisible();

    await tablePage.refreshButton.click();

    await expect(sheet.recordRows).toHaveCount(6);
    await expect(sheet.cell(5, 'Title')).toHaveText('Kindred');
    await expect(sheet.newRecordsNote).toHaveCount(0);
    await expect(tablePage.recordCount).toHaveText('Showing 1–6 of 6');
  });
});

test.describe('duplicating a record', () => {
  test('copies every value except the primary key', async ({
    page,
    schema,
    tablePage: { sheet },
  }) => {
    await sheet.rowHeader(sheet.rowContaining('Hamlet')).click({
      button: 'right',
    });
    await menuItem(page, 'Duplicate Record').click();

    await expect(sheet.rowContaining('Hamlet')).toHaveCount(2);
    await expect
      .poll(async () => (await storedBooks(schema)).at(-1))
      .toEqual({
        id: 6,
        Title: 'Hamlet',
        Author: null,
        Pages: null,
        Code: null,
        Notes: 'e',
      });
  });

  test('leaves an unsaved copy when the database rejects it', async ({
    page,
    schema,
    tablePage: { sheet },
  }) => {
    await sheet.rowHeader(sheet.rowContaining('Emma')).click({
      button: 'right',
    });
    await menuItem(page, 'Duplicate Record').click();

    await expect(sheet.rowContaining('Emma')).toHaveCount(2);
    await expect(sheet.rowHeader(5)).toHaveText('6 *');
    await expect(sheet.failedRows).toHaveCount(1);
    expect(await storedBooks(schema)).toHaveLength(5);
  });
});

test.describe('deleting records', () => {
  test('the row menu deletes one record after confirmation', async ({
    page,
    schema,
    tablePage,
  }) => {
    const { sheet } = tablePage;
    await sheet.rowHeader(sheet.rowContaining('Ulysses')).click({
      button: 'right',
    });
    await menuItem(page, 'Delete Record').click();
    const confirmation = new Modal(page, 'Delete Record?');
    await expect(confirmation.body).toContainText(
      'Once deleted, the record cannot be recovered.',
    );
    await confirmation.button('Yes').click();

    await confirmation.expectClosed();
    await expect(sheet.rowContaining('Ulysses')).toHaveCount(0);
    await expect(sheet.recordRows).toHaveCount(4);
    await expect(tablePage.recordCount).toHaveText('Showing 1–4 of 4');
    await expect
      .poll(async () => (await storedBooks(schema)).map(({ Title }) => Title))
      .toEqual(['Dune', 'Emma', 'Beloved', 'Hamlet']);
  });

  test('the record below a deleted one takes over its selection', async ({
    page,
    tablePage: { sheet },
  }) => {
    await sheet.rowHeader(sheet.rowContaining('Ulysses')).click({
      button: 'right',
    });
    await menuItem(page, 'Delete Record').click();
    await new Modal(page, 'Delete Record?').button('Yes').click();

    await expect(sheet.rowContaining('Ulysses')).toHaveCount(0);
    await expect(sheet.activeCell).toHaveText('4');
    await expect(sheet.selectedCells).toHaveText([
      '4',
      'Beloved',
      'Toni Morrison',
      '324',
      'B1',
      'd',
    ]);
  });

  test('cancelling the confirmation keeps the record', async ({
    page,
    schema,
    tablePage: { sheet },
  }) => {
    await sheet.rowHeader(sheet.rowContaining('Ulysses')).click({
      button: 'right',
    });
    await menuItem(page, 'Delete Record').click();
    const confirmation = new Modal(page, 'Delete Record?');
    await confirmation.button('Cancel').click();

    await confirmation.expectClosed();
    await expect(sheet.rowContaining('Ulysses')).toBeVisible();
    expect(await storedBooks(schema)).toHaveLength(5);
  });

  test('the row menu deletes all selected records', async ({
    page,
    schema,
    tablePage: { sheet },
  }) => {
    await sheet.dragBetween(sheet.rowHeader(1), sheet.rowHeader(2));
    await sheet.rowHeader(1).click({ button: 'right' });
    await menuItem(page, 'Delete 2 Records').click();
    await new Modal(page, 'Delete 2 Records?').button('Yes').click();

    await expect(sheet.recordRows).toHaveCount(3);
    await expect
      .poll(async () => (await storedBooks(schema)).map(({ Title }) => Title))
      .toEqual(['Dune', 'Beloved', 'Hamlet']);
  });

  test('the inspector deletes the selected record and confirms with a message', async ({
    page,
    schema,
    tablePage,
  }) => {
    const { sheet, inspector } = tablePage;
    await sheet.rowHeader(sheet.rowContaining('Beloved')).click();
    await expect(inspector.tab('Record')).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await inspector.button('Delete Record').click();
    await tablePage.deleteRecordsModal.button(/^Delete/).click();

    await new Toasts(page).expectMessage('1 record deleted successfully!');
    await expect(sheet.rowContaining('Beloved')).toHaveCount(0);
    await expect
      .poll(async () => (await storedBooks(schema)).map(({ Title }) => Title))
      .toEqual(['Dune', 'Emma', 'Ulysses', 'Hamlet']);
  });

  test('keeps a record that another table references and shows the error of the database', async ({
    page,
    schema,
    tablePage: { sheet },
  }) => {
    await runSqlInSchema(
      schema,
      `CREATE TABLE "Loans" (
         id integer PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
         "Book" integer REFERENCES "Books" (id) ON DELETE RESTRICT
       );
       INSERT INTO "Loans" ("Book") VALUES (2);`,
    );
    await sheet.rowHeader(sheet.rowContaining('Emma')).click({
      button: 'right',
    });
    await menuItem(page, 'Delete Record').click();
    const confirmation = new Modal(page, 'Delete Record?');
    await confirmation.button('Yes').click();

    await new Toasts(page).expectMessage(
      'Unable to delete row. Error: ForeignKeyViolation: update or delete on table "Books" violates foreign key constraint "Loans_Book_fkey" on table "Loans"',
    );
    await confirmation.expectClosed();
    await expect(sheet.rowContaining('Emma')).toBeVisible();
    await expect(sheet.recordRows).toHaveCount(5);
    expect(await storedBooks(schema)).toHaveLength(5);
  });

  test('of several records, keeps one that a trigger skips and says that PostgreSQL ignored it', async ({
    page,
    schema,
    tablePage: { sheet },
  }) => {
    await runSqlInSchema(
      schema,
      `CREATE FUNCTION keep_hamlet() RETURNS trigger LANGUAGE plpgsql AS $$
       BEGIN
         IF OLD."Title" = 'Hamlet' THEN RETURN NULL; END IF;
         RETURN OLD;
       END $$;
       CREATE TRIGGER keep_hamlet BEFORE DELETE ON "Books"
         FOR EACH ROW EXECUTE FUNCTION keep_hamlet();`,
    );
    await sheet.dragBetween(sheet.rowHeader(3), sheet.rowHeader(4));
    await sheet.rowHeader(4).click({ button: 'right' });
    await menuItem(page, 'Delete 2 Records').click();
    await new Modal(page, 'Delete 2 Records?').button('Yes').click();

    await new Toasts(page).expectMessage(
      'Unable to delete row. Error: Row 5 was silently ignored by PostgreSQL.',
    );
    await expect(sheet.rowContaining('Beloved')).toHaveCount(0);
    await expect(sheet.rowContaining('Hamlet')).toBeVisible();
    await expect
      .poll(async () => (await storedBooks(schema)).map(({ Title }) => Title))
      .toEqual(['Dune', 'Emma', 'Ulysses', 'Hamlet']);
  });

  test('also drops an unsaved new record that is not selected', async ({
    page,
    schema,
    tablePage,
  }) => {
    const { sheet } = tablePage;
    await tablePage.newRecordButton.click();
    await expect(sheet.rowHeader(5)).toHaveText('6 *');
    await sheet.rowHeader(sheet.rowContaining('Ulysses')).click({
      button: 'right',
    });
    await menuItem(page, 'Delete Record').click();
    await new Modal(page, 'Delete Record?').button('Yes').click();

    await expect(sheet.rowContaining('Ulysses')).toHaveCount(0);
    await expect(sheet.recordRows).toHaveCount(4);
    await expect(sheet.newRecordsNote).toHaveCount(0);
    await expect(tablePage.recordCount).toHaveText('Showing 1–4 of 4');
    await expect
      .poll(async () => (await storedBooks(schema)).map(({ Title }) => Title))
      .toEqual(['Dune', 'Emma', 'Beloved', 'Hamlet']);
  });

  test('the row menu deletes an unsaved new record without a deletion request', async ({
    page,
    schema,
    tablePage,
  }) => {
    const { sheet } = tablePage;
    await tablePage.newRecordButton.click();
    await expect(sheet.rowHeader(5)).toHaveText('6 *');
    const rpcCalls = recordRpcCalls(page);
    await sheet.rowHeader(5).click({ button: 'right' });
    await menuItem(page, 'Delete Record').click();
    const confirmation = new Modal(page, 'Delete Record?');
    await confirmation.button('Yes').click();

    // The confirmation closes once the records have been loaded again.
    await confirmation.expectClosed();
    await expect(sheet.recordRows).toHaveCount(5);
    await expect(sheet.newRecordsNote).toHaveCount(0);
    await expect(tablePage.recordCount).toHaveText('Showing 1–5 of 5');
    expect(rpcCalls).toEqual(['records.list']);
    expect(await storedBooks(schema)).toHaveLength(5);
  });
});
