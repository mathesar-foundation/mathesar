import { type Schema, runSqlInSchema } from '../../support/api/mathesar';
import { recordRpcCalls } from '../../support/rpc-log';
import { DateTimePicker } from '../../support/ui/components/date-time-picker';
import { LinkedRecordInput } from '../../support/ui/components/linked-record';
import { RecordSelector } from '../../support/ui/components/record-selector';
import { chooseOption } from '../../support/ui/components/select';
import { Toasts } from '../../support/ui/components/toast';
import { RecordPage } from '../../support/ui/pages/record-page';
import { SchemaPage } from '../../support/ui/pages/schema-page';
import { TablePage } from '../../support/ui/pages/table-page';
import { recordUrl } from '../../support/ui/urls';
import { expect, test } from './library';

interface Author {
  Name: string;
  Country: string | null;
}

function storedAuthors(schema: Schema): Promise<Author[]> {
  return runSqlInSchema<Author>(
    schema,
    'SELECT "Name", "Country" FROM "Authors" ORDER BY id',
  );
}

/** The author of "Hamlet", which has none at first. */
async function storedAuthorOfHamlet(schema: Schema): Promise<number | null> {
  const [hamlet] = await runSqlInSchema<{ Author: number | null }>(
    schema,
    `SELECT "Author" FROM "Books" WHERE "Title" = 'Hamlet'`,
  );
  return hamlet?.Author ?? null;
}

// The selector ignores clicks beside its window for 300 ms after it opens.
// A search result arrives later than that, so tests on clicks search first.

// A closed selector stays on the page while it fades out, but searches no
// more, so a new search result shows that it stayed open.

test.describe('the record selector of a linked cell', () => {
  let tablePage: TablePage;
  let selector: RecordSelector;

  test.beforeEach(async ({ page, library }) => {
    tablePage = new TablePage(page);
    selector = new RecordSelector(page);
    await tablePage.goto(library.books);
    await tablePage.sheet.cell(4, 'Author').dblclick();
    await expect(selector.rows).toHaveCount(4);
  });

  test('opens with a search input per column, all records and the focus in the first column that is no primary key', async () => {
    await expect(selector.title).toHaveText('Pick a Record from Authors');
    await expect(selector.searchInput('id')).toBeVisible();
    await expect(selector.searchInput('Country')).toBeVisible();
    await expect(selector.linkedRecordSearchInput('Agent')).toBeVisible();
    await expect(selector.searchInput('Name')).toBeFocused();
    await expect(selector.row('Jane Austen')).toContainText('UK');
    await expect(selector.row('Jane Austen')).toContainText('Penguin');
    await expect(selector.highlightedRow).toContainText('Frank Herbert');
    await expect(selector.recordCount).toHaveText('4 Records');
  });

  test('the results follow the search while the user types', async () => {
    await selector.searchInput('Name').pressSequentially('j');
    await expect(selector.rows).toHaveCount(2);
    await expect(selector.recordCount).toHaveText('2 Records');

    await selector.searchInput('Name').pressSequentially('am');
    await expect(selector.rows).toHaveCount(1);
    await expect(selector.rows).toContainText(['James Joyce']);
    await expect(selector.recordCount).toHaveText('1 Record');
  });

  test('a record that matches more search values ranks first', async () => {
    await selector.searchInput('Name').fill('j');
    await selector.searchInput('Country').fill('ire');

    await expect(selector.rows).toContainText(['James Joyce', 'Jane Austen']);
    await expect(selector.rows).toHaveCount(2);
  });

  test('a word typed without a pause is searched once', async ({ page }) => {
    const rpcCalls = recordRpcCalls(page);
    await selector.searchInput('Name').pressSequentially('toni');

    await expect(selector.rows).toHaveCount(1);
    expect(rpcCalls).toEqual(['records.search']);
  });

  test('the arrow keys move the highlight and Enter picks the highlighted record', async ({
    page,
    schema,
  }) => {
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await expect(selector.highlightedRow).toContainText('James Joyce');
    await page.keyboard.press('ArrowUp');
    await expect(selector.highlightedRow).toContainText('Jane Austen');

    await page.keyboard.press('Enter');
    await selector.expectClosed();
    await expect(tablePage.sheet.cell(4, 'Author')).toHaveText('Jane Austen');
    await expect.poll(() => storedAuthorOfHamlet(schema)).toBe(2);
  });

  test('the highlight stops at the first and at the last record', async ({
    page,
  }) => {
    await page.keyboard.press('ArrowUp');
    await expect(selector.highlightedRow).toContainText('Frank Herbert');

    for (let press = 0; press < 5; press += 1) {
      await page.keyboard.press('ArrowDown');
    }
    await expect(selector.highlightedRow).toContainText('Toni Morrison');
    await expect(selector.highlightedRow).toHaveCount(1);
  });

  test('the pointer moves the highlight and the arrow keys go on from there', async ({
    page,
  }) => {
    await selector.row('James Joyce').hover();
    await expect(selector.highlightedRow).toContainText('James Joyce');

    await page.keyboard.press('ArrowDown');
    await expect(selector.highlightedRow).toContainText('Toni Morrison');
  });

  test('Enter picks the best match of a search', async ({ page, schema }) => {
    await page.keyboard.press('ArrowDown');
    await selector.searchInput('Name').fill('toni');
    await expect(selector.rows).toHaveCount(1);
    await expect(selector.highlightedRow).toContainText('Toni Morrison');

    await page.keyboard.press('Enter');
    await expect(tablePage.sheet.cell(4, 'Author')).toHaveText('Toni Morrison');
    await expect.poll(() => storedAuthorOfHamlet(schema)).toBe(4);
  });

  test('a click on a found record picks it', async ({ schema }) => {
    await selector.searchInput('Name').fill('jane');
    await expect(selector.rows).toHaveCount(1);
    await selector.row('Jane Austen').click();

    await selector.expectClosed();
    await expect(tablePage.sheet.cell(4, 'Author')).toHaveText('Jane Austen');
    await expect.poll(() => storedAuthorOfHamlet(schema)).toBe(2);
  });

  test('the "Pick" button of a record picks it', async ({ schema }) => {
    await selector.searchInput('Country').fill('usa');
    await expect(selector.rows).toHaveCount(2);
    await selector.submitButton(selector.row('Toni Morrison')).click();

    await selector.expectClosed();
    await expect(tablePage.sheet.cell(4, 'Author')).toHaveText('Toni Morrison');
    await expect.poll(() => storedAuthorOfHamlet(schema)).toBe(4);
  });

  test('clicks inside the window keep it open', async () => {
    await selector.searchInput('Name').fill('jane');
    await expect(selector.rows).toHaveCount(1);

    await selector.title.click();
    await selector.recordCount.click();
    await selector.searchInput('Country').click();
    await expect(selector.searchInput('Country')).toBeFocused();

    await selector.searchInput('Name').fill('toni');
    await expect(selector.rows).toHaveCount(1);
    await expect(selector.rows).toContainText(['Toni Morrison']);
  });

  test('a click beside the window closes it without a change', async ({
    schema,
  }) => {
    await selector.searchInput('Name').fill('jane');
    await expect(selector.rows).toHaveCount(1);
    await selector.clickOutside();

    await selector.expectClosed();
    await expect(tablePage.sheet.cell(4, 'Author')).toHaveText('NULL');
    await tablePage.sheet.expectFocusOnActiveCell();
    expect(await storedAuthorOfHamlet(schema)).toBeNull();
  });

  test('the close button closes it without a change', async ({ schema }) => {
    await selector.closeButton.click();

    await selector.expectClosed();
    await expect(tablePage.sheet.cell(4, 'Author')).toHaveText('NULL');
    expect(await storedAuthorOfHamlet(schema)).toBeNull();
  });

  test('offers to create a record only while a search value is entered', async () => {
    await expect(selector.createRecordButton).toHaveCount(0);

    await selector.searchInput('Name').fill('Isabel');
    await expect(selector.createRecordButton).toBeVisible();

    await selector.searchInput('Name').fill('');
    await expect(selector.createRecordButton).toHaveCount(0);
    await expect(selector.rows).toHaveCount(4);
  });

  test('creates a record from the search values and picks it', async ({
    schema,
  }) => {
    await selector.searchInput('Name').fill('Isabel Allende');
    await selector.searchInput('Country').fill('Chile');
    await expect(selector.emptyNote).toHaveText('No matching records');
    await selector.createRecordButton.click();

    await selector.expectClosed();
    await expect(tablePage.sheet.cell(4, 'Author')).toHaveText(
      'Isabel Allende',
    );
    expect((await storedAuthors(schema)).at(-1)).toEqual({
      Name: 'Isabel Allende',
      Country: 'Chile',
    });
    await expect.poll(() => storedAuthorOfHamlet(schema)).toBe(5);
  });

  test('shows the database error and stays open when the record cannot be created', async ({
    page,
    schema,
  }) => {
    await selector.searchInput('Country').fill('Chile');
    await selector.createRecordButton.click();

    await new Toasts(page).expectMessage(
      'null value in column "Name" of relation "Authors" violates not-null constraint',
    );
    await expect(selector.searchInput('Country')).toHaveValue('Chile');
    await selector.searchInput('Name').fill('jane');
    await expect(selector.rows).toHaveCount(1);
    await expect(selector.rows).toContainText(['Jane Austen']);
    expect(await storedAuthors(schema)).toHaveLength(4);
  });

  test('says that no record matches and ignores Enter then', async ({
    page,
  }) => {
    await selector.searchInput('Name').fill('nobody');
    await expect(selector.emptyNote).toHaveText('No matching records');
    await expect(selector.rows).toHaveCount(0);

    await page.keyboard.press('Enter');
    await selector.searchInput('Name').fill('toni');
    await expect(selector.rows).toHaveCount(1);
    await expect(tablePage.sheet.cell(4, 'Author')).toHaveText('NULL');
  });

  test('starts with empty search inputs every time it opens', async ({
    page,
  }) => {
    await selector.searchInput('Name').fill('jane');
    await expect(selector.rows).toHaveCount(1);
    await page.keyboard.press('Escape');
    await selector.expectClosed();

    await page.keyboard.press('Enter');
    await expect(selector.rows).toHaveCount(4);
    await expect(selector.searchInput('Name')).toHaveValue('');
    await expect(selector.searchInput('Name')).toBeFocused();
  });
});

test.describe('searching by a linked record inside the record selector', () => {
  let tablePage: TablePage;
  let selector: RecordSelector;
  let agentSearch: LinkedRecordInput;

  test.beforeEach(async ({ page, library }) => {
    tablePage = new TablePage(page);
    selector = new RecordSelector(page);
    agentSearch = new LinkedRecordInput(
      selector.linkedRecordSearchInput('Agent'),
    );
    await tablePage.goto(library.books);
    await tablePage.sheet.cell(4, 'Author').dblclick();
    await expect(selector.rows).toHaveCount(4);
  });

  test('a click on the search input of a linked column opens a selector for the linked table on top', async () => {
    await agentSearch.root.click();

    await expect(selector.nested.title).toHaveText(
      'Pick a Record from Publishers',
    );
    await expect(selector.nested.rows).toHaveCount(3);
    await expect(selector.nested.searchInput('Name')).toBeFocused();
  });

  test('a record chosen in the nested selector narrows the results of the first one', async () => {
    await agentSearch.root.click();
    await selector.nested.searchInput('Name').fill('pen');
    await expect(selector.nested.rows).toHaveCount(1);
    await selector.nested.row('Penguin').click();

    await selector.nested.expectClosed();
    await selector.expectOpen();
    await expect(agentSearch.summary).toHaveText('Penguin');
    await expect(selector.rows).toHaveCount(1);
    await expect(selector.rows).toContainText(['Jane Austen']);
  });

  test('"Clear value" takes the linked record out of the search', async () => {
    await agentSearch.root.click();
    await selector.nested.row('Penguin').click();
    await expect(selector.rows).toHaveCount(1);
    await agentSearch.clearButton.click();

    await expect(selector.rows).toHaveCount(4);
    await expect(agentSearch.summary).toHaveCount(0);
    await selector.expectOpen();
  });

  test('Escape closes the nested selector first and the first one next', async ({
    page,
  }) => {
    await agentSearch.root.click();
    await selector.nested.expectOpen();

    await page.keyboard.press('Escape');
    await selector.nested.expectClosed();
    await selector.searchInput('Name').fill('jane');
    await expect(selector.rows).toHaveCount(1);

    await page.keyboard.press('Escape');
    await selector.expectClosed();
  });

  test('on the search input of a linked column, Enter opens the nested selector and Shift+Enter picks', async ({
    page,
    schema,
  }) => {
    await agentSearch.root.focus();
    await page.keyboard.press('Enter');
    await expect(selector.nested.rows).toHaveCount(3);
    await page.keyboard.press('Escape');
    await selector.nested.expectClosed();
    await expect(agentSearch.root).toBeFocused();

    await page.keyboard.press('Shift+Enter');
    await selector.expectClosed();
    await expect(tablePage.sheet.cell(4, 'Author')).toHaveText('Frank Herbert');
    await expect.poll(() => storedAuthorOfHamlet(schema)).toBe(1);
  });
});

test.describe('searching by a date, a boolean or a file inside the record selector', () => {
  let selector: RecordSelector;

  test.beforeEach(async ({ page, api, schema, library }) => {
    selector = new RecordSelector(page);
    await runSqlInSchema(
      schema,
      `ALTER TABLE "Authors" ADD COLUMN "Signed" date,
         ADD COLUMN "Retired" boolean, ADD COLUMN "Portrait" jsonb;
       UPDATE "Authors" SET "Signed" = '1963-03-01', "Retired" = true WHERE id = 1;
       UPDATE "Authors" SET "Signed" = '1963-03-15', "Retired" = false WHERE id = 2;
       UPDATE "Authors" SET "Retired" = true WHERE id = 3;`,
    );
    await api.setColumnMetadata(
      await api.getTable(schema, 'Authors'),
      'Portrait',
      { file_backend: 'default' },
    );
    const tablePage = new TablePage(page);
    await tablePage.goto(library.books);
    await tablePage.sheet.cell(4, 'Author').dblclick();
    await expect(selector.rows).toHaveCount(4);
  });

  test('a day picked in the calendar of a date column finds the records of that day', async ({
    page,
  }) => {
    const calendar = new DateTimePicker(page);
    await selector.searchInput('Signed').click();
    await selector.searchInput('Signed').pressSequentially('03/01/1963');
    await expect(calendar.month).toHaveText('March');
    await expect(selector.rows).toHaveCount(1);
    await expect(selector.rows).toContainText(['Frank Herbert']);
    await calendar.day(15).click();

    await expect(calendar.root).toBeHidden();
    await expect(selector.searchInput('Signed')).toHaveValue('03/15/1963');
    await expect(selector.rows).toHaveCount(1);
    await expect(selector.rows).toContainText(['Jane Austen']);
  });

  test('a value chosen in the select of a boolean column finds the records with that value', async () => {
    await selector.searchInput('Name').fill('nobody');
    await expect(selector.emptyNote).toHaveText('No matching records');
    await expect(selector.searchSelect('Retired')).toHaveText('');
    await chooseOption(selector.searchSelect('Retired'), 'false');

    await expect(selector.rows).toHaveCount(1);
    await expect(selector.rows).toContainText(['Jane Austen']);
    await expect(selector.searchSelect('Retired')).toHaveText('false');
  });

  test('a file column has no search', async () => {
    await expect(selector.searchInput('Portrait')).toBeDisabled();
  });
});

test.describe('the record selector of a large or an empty table', () => {
  let tablePage: TablePage;
  let selector: RecordSelector;

  test.beforeEach(({ page }) => {
    tablePage = new TablePage(page);
    selector = new RecordSelector(page);
  });

  test('says that the table has no records', async ({ schema, library }) => {
    await runSqlInSchema(
      schema,
      `CREATE TABLE "Shelves" (
         id integer PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
         "Label" text
       );
       ALTER TABLE "Books" ADD COLUMN "Shelf" integer REFERENCES "Shelves" (id);`,
    );
    await tablePage.goto(library.books);
    await tablePage.sheet.cell(0, 'Shelf').dblclick();

    await expect(selector.emptyNote).toHaveText('No existing records');
    await expect(selector.recordCount).toHaveCount(0);
  });

  test.describe('with 250 records', () => {
    test.beforeEach(async ({ schema, library }) => {
      await runSqlInSchema(
        schema,
        `CREATE TABLE "Editions" (
           id integer PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
           "Label" text
         );
         INSERT INTO "Editions" ("Label")
           SELECT 'edition ' || n FROM generate_series(1, 240) AS n;
         INSERT INTO "Editions" ("Label")
           SELECT 'reprint ' || n FROM generate_series(1, 10) AS n;
         ALTER TABLE "Books" ADD COLUMN "Edition" integer REFERENCES "Editions" (id);`,
      );
      await tablePage.goto(library.books);
      await tablePage.sheet.cell(0, 'Edition').dblclick();
      await expect(selector.rows).toHaveCount(100);
    });

    test('shows a hundred records per page and moves to the next page', async () => {
      await expect(selector.recordCount).toHaveText('Showing 1–100 of 250');
      await expect(selector.currentPageButton).toHaveText('Page 1');

      await selector.nextPageButton.click();
      await expect(selector.recordCount).toHaveText('Showing 101–200 of 250');
      await expect(selector.currentPageButton).toHaveText('Page 2');
      await expect(selector.rows.first()).toContainText('edition 101');
    });

    test('the page form jumps to a page and clicks in its dropdown keep the selector open', async ({
      schema,
    }) => {
      // Paging while the found records still download throws an uncaught
      // error (records-request-abort-uncaught), so the count comes first.
      await selector.searchInput('Label').fill('edition');
      await expect(selector.recordCount).toHaveText('Showing 1–100 of 240');
      await selector.goToPage(3);

      await expect(selector.recordCount).toHaveText('Showing 201–240 of 240');
      await expect(selector.rows).toHaveCount(40);
      await selector.rows.first().click();
      await selector.expectClosed();
      await expect(tablePage.sheet.cell(0, 'Edition')).toHaveText(
        'edition 201',
      );
      await expect
        .poll(() =>
          runSqlInSchema(schema, 'SELECT "Edition" FROM "Books" WHERE id = 1'),
        )
        .toEqual([{ Edition: 201 }]);
    });
  });
});

test.describe('the record selector that opens a record', () => {
  let selector: RecordSelector;

  test.beforeEach(({ page }) => {
    selector = new RecordSelector(page);
  });

  test('"Find a Record" on the schema page searches a table and opens the page of the chosen record', async ({
    page,
    schema,
    library,
  }) => {
    const schemaPage = new SchemaPage(page);
    await schemaPage.goto(schema);
    await schemaPage.findRecordButton('Authors').click();

    await expect(selector.title).toHaveText('Open a Record from Authors');
    await expect(selector.searchInput('Name')).toBeFocused();
    await expect(selector.row('Jane Austen')).toHaveAttribute(
      'href',
      recordUrl(library.authors, 2),
    );

    await selector.searchInput('Name').fill('toni');
    await expect(selector.rows).toHaveCount(1);
    await selector.row('Toni Morrison').click();

    await expect(page).toHaveURL(recordUrl(library.authors, 4));
    await selector.expectClosed();
    const recordPage = new RecordPage(page);
    await expect(recordPage.summary).toHaveText('Toni Morrison');
    await expect(recordPage.relatedRecordHeadings).toHaveText(['Books']);
  });

  test('Enter opens the page of the highlighted record', async ({
    page,
    schema,
    library,
  }) => {
    const schemaPage = new SchemaPage(page);
    await schemaPage.goto(schema);
    await schemaPage.findRecordButton('Authors').click();
    await expect(selector.rows).toHaveCount(4);
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');

    await expect(page).toHaveURL(recordUrl(library.authors, 2));
    await selector.expectClosed();
    const recordPage = new RecordPage(page);
    await expect(recordPage.summary).toHaveText('Jane Austen');
    await expect(recordPage.relatedRecordHeadings).toHaveText(['Books']);
  });

  test('says that a table without a primary key is not supported', async ({
    page,
    schema,
  }) => {
    await runSqlInSchema(
      schema,
      `CREATE TABLE "Notes" ("Text" text); INSERT INTO "Notes" VALUES ('a');`,
    );
    const schemaPage = new SchemaPage(page);
    await schemaPage.goto(schema);
    await schemaPage.findRecordButton('Notes').click();

    await expect(selector.warning).toHaveText(
      'The Record selector does not support tables without a Primary key.',
    );
    await expect(selector.rows).toHaveCount(0);
    await expect(selector.recordCount).toHaveText('1 Record');
  });

  test('Escape closes it without giving the focus back to "Find a Record"', async ({
    page,
    library,
  }) => {
    const schemaPage = new SchemaPage(page);
    await schemaPage.goto(library.authors.schema);
    await schemaPage.findRecordButton('Authors').click();
    await expect(selector.rows).toHaveCount(4);
    await page.keyboard.press('Escape');

    await selector.expectClosed();
    await expect(schemaPage.findRecordButton('Authors')).not.toBeFocused();
  });
});
