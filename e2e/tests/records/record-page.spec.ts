import {
  type Schema,
  type Table,
  runSqlInSchema,
} from '../../support/api/mathesar';
import { holdRpcCalls } from '../../support/held-requests';
import { pinsKnownBug } from '../../support/known-bugs';
import { uncaughtErrorMessage } from '../../support/page-errors';
import { recordRpcCalls } from '../../support/rpc-log';
import { failRpcMethod } from '../../support/rpc-failures';
import { Breadcrumb } from '../../support/ui/components/breadcrumb';
import { DateTimePicker } from '../../support/ui/components/date-time-picker';
import { fillFormattedInput } from '../../support/ui/components/formatted-input';
import { menuItem, openMenu } from '../../support/ui/components/menu';
import { RecordSelector } from '../../support/ui/components/record-selector';
import { openSelect } from '../../support/ui/components/select';
import { Toasts } from '../../support/ui/components/toast';
import { tooltip } from '../../support/ui/components/tooltip';
import { RecordModal, RecordPage } from '../../support/ui/pages/record-page';
import { TablePage } from '../../support/ui/pages/table-page';
import { recordUrl, tableUrl } from '../../support/ui/urls';
import { expect, test } from '../relationships/library';

interface Book {
  Title: string | null;
  Author: number | null;
  Pages: number | null;
}

async function storedBook(
  schema: Schema,
  id: number,
): Promise<Book | undefined> {
  const [book] = await runSqlInSchema<Book>(
    schema,
    `SELECT "Title", "Author", "Pages" FROM "Books" WHERE id = ${id}`,
  );
  return book;
}

async function storedBookIds(schema: Schema): Promise<number[]> {
  const books = await runSqlInSchema<{ id: number }>(
    schema,
    'SELECT id FROM "Books" ORDER BY id',
  );
  return books.map((book) => book.id);
}

/** Opens the page of a book and waits until its tags, the records that link to it, have loaded. */
async function openBook(
  recordPage: RecordPage,
  books: Table,
  id: number,
  tagCount: string,
): Promise<void> {
  await recordPage.goto(books, id);
  await expect(recordPage.relatedRecords('Books_Tags').recordCount).toHaveText(
    tagCount,
  );
}

test.describe('the page of a record', () => {
  let recordPage: RecordPage;

  test.beforeEach(async ({ page, schema, library }) => {
    recordPage = new RecordPage(page);
    await runSqlInSchema(
      schema,
      `COMMENT ON COLUMN "Books"."Pages" IS 'Of the first edition'`,
    );
    await openBook(recordPage, library.books, 1, 'Showing 1–2 of 2');
  });

  test('shows a field per column with the values of the record, under its summary and table', async ({
    library,
  }) => {
    await expect(recordPage.summary).toHaveText('Dune');
    await expect(recordPage.tableLink).toHaveText('Books');
    await expect(recordPage.tableLink).toHaveAttribute(
      'href',
      tableUrl(library.books),
    );
    await expect(recordPage.fieldLabels).toHaveText([
      'id',
      'Title',
      'Author',
      'Publisher',
      'Pages',
    ]);
    await expect(recordPage.field('id')).toHaveValue('1');
    await expect(recordPage.field('id')).toBeDisabled();
    await expect(recordPage.field('Title')).toHaveValue('Dune');
    await expect(recordPage.linkedRecord('Author').recordLink).toHaveText(
      'Frank Herbert',
    );
    await expect(recordPage.linkedRecord('Author').recordLink).toHaveAttribute(
      'href',
      recordUrl(library.authors, 1),
    );
    await expect(recordPage.field('Pages')).toHaveValue('412');
    await expect(recordPage.nullMark('Title')).toHaveCount(0);
  });

  test('shows the description of a column when the pointer is on its icon', async ({
    page,
  }) => {
    await expect(recordPage.descriptionIcon('Title')).toHaveCount(0);
    await recordPage.descriptionIcon('Pages').hover();

    await expect(tooltip(page)).toHaveText('Of the first edition');
  });

  test('Save stores the changes at once, and the title, the tab and the breadcrumb follow the new summary', async ({
    page,
    schema,
  }) => {
    const rpcCalls = recordRpcCalls(page);
    await recordPage.field('Title').fill('Dune Messiah');
    await fillFormattedInput(recordPage.field('Pages'), '256');
    await expect(recordPage.status).toHaveText('Unsaved Changes');
    await recordPage.saveButton.click();

    await expect(recordPage.status).toHaveText('All Changes Saved');
    await expect(recordPage.saveButton).toHaveCount(0);
    await expect(recordPage.discardButton).toHaveCount(0);
    await expect(recordPage.summary).toHaveText('Dune Messiah');
    await expect(page).toHaveTitle('Dune Messiah | Mathesar');
    await expect(new Breadcrumb(page).items.last()).toHaveText('Dune Messiah');
    expect(rpcCalls).toEqual(['records.patch']);
    expect(await storedBook(schema, 1)).toEqual({
      Title: 'Dune Messiah',
      Author: 1,
      Pages: 256,
    });
  });

  test('stores nothing until Save, whatever the keys and the focus do', async ({
    page,
    schema,
  }) => {
    const rpcCalls = recordRpcCalls(page);
    await recordPage.field('Title').fill('Dune Messiah');
    await page.keyboard.press('Enter');
    await fillFormattedInput(recordPage.field('Pages'), '256');
    await page.keyboard.press('Enter');
    await recordPage.summary.click();

    await expect(recordPage.field('Title')).toHaveValue('Dune Messiah\n');
    await expect(recordPage.status).toHaveText('Unsaved Changes');
    expect(rpcCalls).toEqual([]);
    expect(await storedBook(schema, 1)).toEqual({
      Title: 'Dune',
      Author: 1,
      Pages: 412,
    });
  });

  test('Discard Changes brings back the stored values', async ({ page }) => {
    const rpcCalls = recordRpcCalls(page);
    await recordPage.field('Title').fill('Dune Messiah');
    await recordPage.linkedRecord('Author').clearButton.click();
    await recordPage.discardButton.click();

    await expect(recordPage.field('Title')).toHaveValue('Dune');
    await expect(recordPage.linkedRecord('Author').summary).toHaveText(
      'Frank Herbert',
    );
    await expect(recordPage.saveButton).toHaveCount(0);
    await expect(recordPage.status).toHaveCount(0);
    expect(rpcCalls).toEqual([]);
  });

  test('"Set to NULL" in the menu of a field marks it NULL, and Save stores NULL', async ({
    page,
    schema,
  }) => {
    await recordPage.fieldOptionsButton('Title').click();
    await menuItem(page, 'Set to NULL').click();

    await expect(recordPage.field('Title')).toHaveValue('');
    await expect(recordPage.nullMark('Title')).toBeVisible();
    await recordPage.saveButton.click();
    await expect(recordPage.saveButton).toHaveCount(0);
    expect((await storedBook(schema, 1))?.Title).toBeNull();
  });

  test('an emptied text field is stored as an empty text, not as NULL', async ({
    schema,
  }) => {
    await recordPage.field('Title').fill('');

    await expect(recordPage.nullMark('Title')).toHaveCount(0);
    await recordPage.saveButton.click();
    await expect(recordPage.saveButton).toHaveCount(0);
    expect((await storedBook(schema, 1))?.Title).toBe('');
  });

  test('the primary key cannot be set to NULL', async ({ page }) => {
    await recordPage.fieldOptionsButton('id').click();

    await expect(menuItem(page, 'Set to NULL')).toBeDisabled();
  });

  test('shows why the database refuses a save under the buttons and keeps the change', async ({
    schema,
  }) => {
    await runSqlInSchema(
      schema,
      `ALTER TABLE "Books" ADD CONSTRAINT "Pages are positive" CHECK ("Pages" > 0)`,
    );
    await fillFormattedInput(recordPage.field('Pages'), '-1');
    await recordPage.saveButton.click();

    await expect(recordPage.errors).toContainText(
      'violates check constraint "Pages are positive"',
    );
    await expect(recordPage.status).toHaveText('Unable to save changes');
    await expect(recordPage.field('Pages')).toHaveValue('-1');
    expect((await storedBook(schema, 1))?.Pages).toBe(412);
  });

  test('drops unsaved changes without a warning when the user leaves', async ({
    page,
    schema,
    library,
  }) => {
    await recordPage.field('Title').fill('Dune Messiah');
    await recordPage.tableLink.click();

    await expect(page).toHaveURL(tableUrl(library.books));
    await expect(new TablePage(page).sheet.cell(0, 'Title')).toHaveText('Dune');
    expect((await storedBook(schema, 1))?.Title).toBe('Dune');
  });
});

test('marks NULL in every field but a date field, which shows its format instead', async ({
  page,
  schema,
  library,
}) => {
  await runSqlInSchema(
    schema,
    'ALTER TABLE "Books" ADD COLUMN "Published" date',
  );
  const recordPage = new RecordPage(page);
  await openBook(recordPage, library.books, 5, 'No records found');

  await expect(recordPage.nullMark('Author')).toBeVisible();
  await expect(recordPage.nullMark('Pages')).toBeVisible();
  await expect(recordPage.nullMark('Published')).toHaveCount(0);
  await expect(recordPage.field('Published')).toHaveAttribute(
    'placeholder',
    'MM/DD/YYYY',
  );
});

test('has no field for the column that tracks the last editor', async ({
  page,
  api,
  schema,
  library,
}) => {
  await runSqlInSchema(
    schema,
    'ALTER TABLE "Books" ADD COLUMN "Editor" integer',
  );
  const books = await api.getTable(schema, 'Books');
  await api.makeUserColumn(books, 'Editor');
  await api.trackEditingUserIn(books, 'Editor');
  const recordPage = new RecordPage(page);
  await openBook(recordPage, library.books, 1, 'Showing 1–2 of 2');

  await expect(recordPage.fieldLabels).toHaveText([
    'id',
    'Title',
    'Author',
    'Publisher',
    'Pages',
  ]);
});

test('a boolean field is a select of NULL, true and false, whose choice Save stores', async ({
  page,
  schema,
  library,
}) => {
  await runSqlInSchema(
    schema,
    `ALTER TABLE "Books" ADD COLUMN "Read" boolean;
     UPDATE "Books" SET "Read" = true WHERE id = 1;`,
  );
  const recordPage = new RecordPage(page);
  await openBook(recordPage, library.books, 1, 'Showing 1–2 of 2');
  await expect(recordPage.select('Read')).toHaveText('true');
  const options = await openSelect(recordPage.select('Read'));
  await expect(options.getByRole('option')).toHaveText(['', 'true', 'false']);
  await options.getByRole('option', { name: 'false' }).click();
  await recordPage.saveButton.click();

  await expect(recordPage.saveButton).toHaveCount(0);
  expect(
    await runSqlInSchema(schema, 'SELECT "Read" FROM "Books" WHERE id = 1'),
  ).toEqual([{ Read: false }]);
});

test('a date field opens a calendar of its month, whose picked day Save stores', async ({
  page,
  schema,
  library,
}) => {
  await runSqlInSchema(
    schema,
    `ALTER TABLE "Books" ADD COLUMN "Published" date;
     UPDATE "Books" SET "Published" = '1965-08-01' WHERE id = 1;`,
  );
  const recordPage = new RecordPage(page);
  const calendar = new DateTimePicker(page);
  await openBook(recordPage, library.books, 1, 'Showing 1–2 of 2');
  await recordPage.field('Published').click();
  await expect(calendar.month).toHaveText('August');
  await expect(calendar.selectedDay).toHaveText('1');
  await calendar.day(20).click();

  await expect(calendar.root).toBeHidden();
  await expect(recordPage.field('Published')).toHaveValue('08/20/1965');
  await expect(recordPage.status).toHaveText('Unsaved Changes');
  await recordPage.saveButton.click();
  await expect(recordPage.saveButton).toHaveCount(0);
  expect(
    await runSqlInSchema(
      schema,
      `SELECT "Published"::text FROM "Books" WHERE id = 1`,
    ),
  ).toEqual([{ Published: '1965-08-20' }]);
});

test.describe('a record page whose related tables cannot be loaded', () => {
  test.beforeEach(async ({ page }) => {
    await failRpcMethod(
      page,
      'tables.list_joinable',
      'The related tables are unavailable',
    );
  });

  test.describe('today', () => {
    test.use({ allowedBrowserErrors: /The related tables are unavailable/ });

    test(
      'shows only the summary of the record, without fields or a message, and throws an error that nothing catches',
      pinsKnownBug('record-page-related-tables-error-uncaught'),
      async ({ page, library }) => {
        const recordPage = new RecordPage(page);
        const releaseRelatedTables = await holdRpcCalls(
          page,
          'tables.list_joinable',
        );
        const uncaughtError = page.waitForEvent('pageerror');
        await recordPage.goto(library.books, 1);
        await expect(recordPage.loadingSpinner).toBeVisible();
        releaseRelatedTables();

        expect(uncaughtErrorMessage(await uncaughtError)).toBe(
          'The related tables are unavailable',
        );
        await expect(recordPage.summary).toHaveText('Dune');
        await expect(recordPage.loadingSpinner).toHaveCount(0);
        await expect(recordPage.fieldLabels).toHaveCount(0);
        await expect(recordPage.relatedRecordHeadings).toHaveCount(0);
        await expect(recordPage.root).not.toContainText(
          'The related tables are unavailable',
        );
      },
    );
  });

  test.fixme('shows the fields and says why the related tables cannot be loaded', async ({
    page,
    library,
  }) => {
    const recordPage = new RecordPage(page);
    await recordPage.goto(library.books, 1);

    await expect(recordPage.field('Title')).toHaveValue('Dune');
    await expect(recordPage.root).toContainText(
      'The related tables are unavailable',
    );
  });
});

test.describe('a field that links to another record', () => {
  let recordPage: RecordPage;
  let selector: RecordSelector;

  test.beforeEach(async ({ page, library }) => {
    recordPage = new RecordPage(page);
    selector = new RecordSelector(page);
    await openBook(recordPage, library.books, 1, 'Showing 1–2 of 2');
  });

  test('takes the record picked in the record selector, which Save stores', async ({
    schema,
  }) => {
    const author = recordPage.linkedRecord('Author');
    await author.root.click();
    await expect(selector.title).toHaveText('Pick a Record from Authors');
    await selector.searchInput('Name').fill('toni');
    await expect(selector.rows).toHaveCount(1);
    await selector.row('Toni Morrison').click();

    await selector.expectClosed();
    await expect(author.summary).toHaveText('Toni Morrison');
    await expect(author.root).toBeFocused();
    await recordPage.saveButton.click();
    await expect(recordPage.saveButton).toHaveCount(0);
    expect((await storedBook(schema, 1))?.Author).toBe(4);
  });

  test('opens the record selector on Enter and is cleared by Delete', async ({
    page,
  }) => {
    const author = recordPage.linkedRecord('Author');
    await author.root.focus();
    await page.keyboard.press('Enter');
    await expect(selector.rows).toHaveCount(4);
    await page.keyboard.press('Escape');
    await selector.expectClosed();
    await expect(author.root).toBeFocused();
    await expect(author.summary).toHaveText('Frank Herbert');

    await page.keyboard.press('Delete');
    await expect(author.summary).toHaveCount(0);
    await expect(recordPage.nullMark('Author')).toBeVisible();
    await expect(recordPage.status).toHaveText('Unsaved Changes');
  });

  test('once it lost the focus, Delete in another field leaves the link alone', async ({
    page,
    schema,
  }) => {
    const author = recordPage.linkedRecord('Author');
    await author.root.focus();
    await recordPage.field('Pages').click();
    await page.keyboard.press('Home');
    await page.keyboard.press('Delete');

    await expect(author.summary).toHaveText('Frank Herbert');
    await expect(recordPage.nullMark('Author')).toHaveCount(0);
    await expect(recordPage.field('Pages')).toHaveValue('12');
    await recordPage.saveButton.click();
    await expect(recordPage.saveButton).toHaveCount(0);
    expect(await storedBook(schema, 1)).toEqual({
      Title: 'Dune',
      Author: 1,
      Pages: 12,
    });
  });

  test('"Clear value" empties it without opening the record selector', async () => {
    const author = recordPage.linkedRecord('Author');
    await author.clearButton.click();

    await expect(author.summary).toHaveCount(0);
    await expect(recordPage.nullMark('Author')).toBeVisible();
    await selector.expectClosed();
  });

  test('a click on the linked record opens it in a modal over the page', async ({
    page,
    library,
  }) => {
    await recordPage.linkedRecord('Author').recordLink.click();

    const authorModal = new RecordModal(page, 'Frank Herbert');
    await expect(authorModal.title).toContainText('Record in Authors');
    await expect(authorModal.view.field('Country')).toHaveValue('USA');
    await expect(page).toHaveURL(recordUrl(library.books, 1));
  });

  test('its menu shows the linked record in a modal or leads to its page', async ({
    page,
    library,
  }) => {
    await recordPage.fieldOptionsButton('Publisher').click();
    await expect(openMenu(page).getByRole('menuitem')).toHaveText([
      'Quick View Linked Record',
      'Set to NULL',
    ]);
    await expect(
      openMenu(page).getByRole('link', { name: 'Open Linked Record' }),
    ).toHaveAttribute('href', recordUrl(library.publishers, 1));
    await menuItem(page, 'Quick View Linked Record').click();

    await expect(new RecordModal(page, 'Ace').view.field('City')).toHaveValue(
      'New York',
    );
  });
});

test.describe('deleting a record from its page', () => {
  let recordPage: RecordPage;

  test.beforeEach(({ page }) => {
    recordPage = new RecordPage(page);
  });

  test('asks first, then deletes the record and returns to its table with a message', async ({
    page,
    schema,
    library,
  }) => {
    await openBook(recordPage, library.books, 5, 'No records found');
    await recordPage.deleteButton.click();
    const { deleteModal } = recordPage;
    await expect(deleteModal.body).toContainText(
      'Once deleted, the record cannot be recovered.',
    );
    await deleteModal.button('Delete Record').click();

    await expect(page).toHaveURL(tableUrl(library.books));
    await new Toasts(page).expectMessage('1 record deleted successfully!');
    await expect(new TablePage(page).sheet.recordRows).toHaveCount(5);
    expect(await storedBookIds(schema)).toEqual([1, 2, 3, 4, 6]);
  });

  test('keeps the record when the deletion is cancelled', async ({
    page,
    schema,
    library,
  }) => {
    await openBook(recordPage, library.books, 5, 'No records found');
    await recordPage.deleteButton.click();
    await recordPage.deleteModal.button('Cancel').click();

    await recordPage.deleteModal.expectClosed();
    await expect(page).toHaveURL(recordUrl(library.books, 5));
    expect(await storedBookIds(schema)).toEqual([1, 2, 3, 4, 5, 6]);
  });

  test('keeps a record that other records link to and shows the database error', async ({
    page,
    schema,
    library,
  }) => {
    await openBook(recordPage, library.books, 1, 'Showing 1–2 of 2');
    await recordPage.deleteButton.click();
    await recordPage.deleteModal.button('Delete Record').click();

    await new Toasts(page).expectMessage(/ForeignKeyViolation/);
    await expect(page).toHaveURL(recordUrl(library.books, 1));
    expect(await storedBookIds(schema)).toEqual([1, 2, 3, 4, 5, 6]);
  });
});
