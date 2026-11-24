import { runSqlInSchema, uniqueName } from '../../support/api/mathesar';
import { readClipboardText } from '../../support/ui/clipboard';
import { chooseOption } from '../../support/ui/components/select';
import { Toasts } from '../../support/ui/components/toast';
import { selectOptions } from '../../support/ui/pages/exploration-transformations';
import { expect, test } from './library';

test('values are formatted by data type, with NULL for missing ones', async ({
  api,
  schema,
  dataExplorer,
}) => {
  await runSqlInSchema(
    schema,
    `CREATE TYPE mood AS ENUM ('sad', 'happy');
     CREATE TABLE "Samples" (
       id integer PRIMARY KEY,
       "Text" text,
       "Whole" integer,
       "Decimal" numeric,
       "Money" mathesar_types.mathesar_money,
       "Checked" boolean,
       "Day" date,
       "Time" time,
       "Moment" timestamp,
       "Duration" interval,
       "Email" mathesar_types.email,
       "Link" mathesar_types.uri,
       "Json" jsonb,
       "List" text[],
       "Mood" mood,
       "Uuid" uuid
     );
     INSERT INTO "Samples" VALUES
       (1, 'Write tests', 3, 1234.5, 19.99, true, '2024-03-15', '13:45:00',
        '2024-03-15 13:45:00', '02:30:00', 'ada@example.com',
        'https://mathesar.org', '{"a": 1}', '{x,y}', 'happy',
        '11111111-1111-1111-1111-111111111111'),
       (2, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL,
        NULL, NULL, NULL, NULL);`,
  );
  const samples = await api.getTable(schema, 'Samples');
  const columns = Object.keys(samples.columns);
  const { id } = await api.defineExploration(samples, {
    name: uniqueName('Samples'),
    columns,
  });
  const { results } = dataExplorer;
  await dataExplorer.gotoSaved(schema, id);

  await expect(results.sheet.columnHeaders).toHaveText(
    columns.map((column) => `Samples_${column}`),
  );
  await results.expectRows([
    [
      '1',
      'Write tests',
      '3',
      '1,234.5',
      '$19.99',
      '03/15/2024',
      '13:45',
      '03/15/2024 13:45',
      '150:00',
      'ada@example.com',
      'https://mathesar.org',
      '{"a": 1}',
      'x y',
      'happy',
      '11111111-1111-1111-1111-111111111111',
    ],
    ['2', ...Array<string>(14).fill('NULL')],
  ]);
  await expect(results.checkbox(0, 'Samples_Checked')).toBeChecked();
  await expect(results.checkbox(0, 'Samples_Checked')).toBeDisabled();
  await expect(results.checkbox(1, 'Samples_Checked')).toBeChecked({
    indeterminate: true,
  });
});

test.describe('a result of 250 records', () => {
  test.beforeEach(async ({ api, schema, dataExplorer }) => {
    await runSqlInSchema(
      schema,
      `CREATE TABLE "Numbers" (id integer PRIMARY KEY, "Label" text);
       INSERT INTO "Numbers"
         SELECT n, 'Row ' || n FROM generate_series(1, 250) AS n;`,
    );
    const numbers = await api.getTable(schema, 'Numbers');
    const { id } = await api.defineExploration(numbers, {
      name: uniqueName('Numbers'),
      columns: ['id', 'Label'],
    });
    await dataExplorer.gotoSaved(schema, id);
  });

  test('is shown 100 records at a time, numbered through all pages', async ({
    dataExplorer: { results },
  }) => {
    const { sheet } = results;
    await expect(results.statusBar).toContainText('Showing 1–100 of 250');
    await expect(sheet.rowHeader(0)).toHaveText('1');
    await expect(sheet.cell(0, 'Numbers_Label')).toHaveText('Row 1');
    await expect(results.paginationLink('Previous')).toBeDisabled();

    await results.paginationLink('Goto Page 2').click();
    await expect(results.statusBar).toContainText('Showing 101–200 of 250');
    await expect(sheet.rowHeader(0)).toHaveText('101');
    await expect(sheet.cell(0, 'Numbers_Label')).toHaveText('Row 101');

    await results.paginationLink('Next').click();
    await expect(results.statusBar).toContainText('Showing 201–250 of 250');
    await expect(sheet.rowHeader(0)).toHaveText('201');
    await expect(results.paginationLink('Next')).toBeDisabled();

    await results.paginationLink('Previous').click();
    await expect(results.statusBar).toContainText('Showing 101–200 of 250');
    await expect(sheet.cell(0, 'Numbers_Label')).toHaveText('Row 101');
  });

  test('starts at the first page again when the page size changes', async ({
    page,
    dataExplorer: { results },
  }) => {
    await results.paginationLink('Goto Page 2').click();
    await expect(results.statusBar).toContainText('Showing 101–200 of 250');
    await expect(await selectOptions(results.pageSize)).toHaveText([
      '100',
      '200',
      '500',
    ]);
    await page.keyboard.press('Escape');

    await chooseOption(results.pageSize, '200');

    await expect(results.statusBar).toContainText('Showing 1–200 of 250');
    await expect(results.sheet.rowHeader(0)).toHaveText('1');
    await expect(results.paginationLink('Goto Page 2')).toBeVisible();
    await expect(results.paginationLink('Goto Page 3')).toHaveCount(0);
  });

  test('starts at the first page again when a transformation is added', async ({
    dataExplorer,
  }) => {
    const { results } = dataExplorer;
    await results.paginationLink('Goto Page 3').click();
    await expect(results.statusBar).toContainText('Showing 201–250 of 250');

    await dataExplorer.addTransformation('Sort');

    await expect(results.statusBar).toContainText('Showing 1–100 of 250');
    await expect(results.sheet.rowHeader(0)).toHaveText('1');
  });

  test('"Refresh" runs the exploration again on the page that is open', async ({
    schema,
    dataExplorer: { results },
  }) => {
    await results.paginationLink('Goto Page 3').click();
    await expect(results.sheet.cell(0, 'Numbers_Label')).toHaveText('Row 201');
    await runSqlInSchema(
      schema,
      `UPDATE "Numbers" SET "Label" = 'Changed' WHERE id = 201;
       DELETE FROM "Numbers" WHERE id > 240;`,
    );

    await results.refreshButton.click();

    await expect(results.statusBar).toContainText('Showing 201–240 of 240');
    await expect(results.sheet.cell(0, 'Numbers_Label')).toHaveText('Changed');
  });
});

test('counts the records of a large result without a thousands separator', async ({
  api,
  schema,
  dataExplorer,
}) => {
  await runSqlInSchema(
    schema,
    `CREATE TABLE "Numbers" (id integer PRIMARY KEY);
     INSERT INTO "Numbers" SELECT generate_series(1, 1234);`,
  );
  const numbers = await api.getTable(schema, 'Numbers');
  const { id } = await api.defineExploration(numbers, {
    name: uniqueName('Numbers'),
    columns: ['id'],
  });

  await dataExplorer.gotoSaved(schema, id);

  await expect(dataExplorer.results.statusBar).toContainText(
    'Showing 1–100 of 1234',
  );
});

test('a result without records says so and offers no pages', async ({
  schema,
  library,
  dataExplorer,
}) => {
  const { results } = dataExplorer;
  await runSqlInSchema(schema, 'DELETE FROM "Loans"');
  await dataExplorer.explore(library.loans);
  await dataExplorer.addColumns('Borrower');

  await expect(results.statusBar).toContainText('No results found');
  await expect(results.pagination).toHaveCount(0);
  await expect(results.sheet.columnHeaders).toHaveText(['Loans_Borrower']);
  // One empty row stands in for the missing records.
  await results.expectRows([[]]);
});

test.describe('cells of the result', () => {
  test.beforeEach(async ({ library, dataExplorer }) => {
    await dataExplorer.explore(library.books);
    await dataExplorer.addColumns('Title', 'Pages');
  });

  test('cannot be edited', async ({ page, dataExplorer: { results } }) => {
    const cell = results.sheet.cell(0, 'Books_Title');
    await cell.dblclick();
    await page.keyboard.press('Enter');
    await page.keyboard.type('Changed');

    await expect(results.sheet.editor).toHaveCount(0);
    await expect(cell).toHaveText('Ficciones');
    await expect(results.sheet.activeCell).toHaveText('Ficciones');
  });

  test('are walked with the arrow keys', async ({
    page,
    dataExplorer: { results },
  }) => {
    await results.sheet.cell(0, 'Books_Title').click();
    await page.keyboard.press('ArrowRight');
    await expect(results.sheet.activeCell).toHaveText('203');

    await page.keyboard.press('ArrowDown');
    await expect(results.sheet.activeCell).toHaveText('165');

    await page.keyboard.press('ArrowLeft');
    await expect(results.sheet.activeCell).toHaveText('Invisible Cities');
  });

  test('are copied with Control+C as tab-separated text', async ({
    page,
    dataExplorer: { results },
  }) => {
    await results.sheet.cell(0, 'Books_Title').click();
    await results.sheet.cell(1, 'Books_Pages').click({ modifiers: ['Shift'] });
    await page.keyboard.press('Control+c');

    await new Toasts(page).expectMessage('Copied 4 cells');
    expect(await readClipboardText(page)).toBe(
      'Ficciones\t203\r\nInvisible Cities\t165',
    );
  });
});

test.describe('the width of a column', () => {
  test('follows the dragged edge of the header and is saved with the exploration', async ({
    page,
    api,
    library,
    dataExplorer,
  }) => {
    const name = uniqueName('Book lengths');
    const { schema } = library.books;
    const { id } = await api.defineExploration(library.books, {
      name,
      columns: ['Title', 'Pages'],
    });
    const { results } = dataExplorer;
    const header = results.sheet.columnHeader('Books_Title');
    await dataExplorer.gotoSaved(schema, id);
    await expect(header).toHaveCSS('width', '160px');

    await results.resizeColumn('Books_Title', 100);
    await expect(header).toHaveCSS('width', '260px');
    await expect(dataExplorer.unsavedMark).toBeVisible();

    await dataExplorer.saveButton.click();
    await expect(dataExplorer.unsavedMark).toHaveCount(0);
    expect((await api.findExploration(schema, name))?.displayOptions).toEqual({
      columnDisplayOptions: {
        '0': {
          column: { name: 'Books_Title', type: { name: 'text' }, index: 0 },
          displayOptions: { display_width: 260 },
        },
      },
    });

    await page.reload();
    await expect(header).toHaveCSS('width', '260px');
    await expect(results.sheet.columnHeader('Books_Pages')).toHaveCSS(
      'width',
      '160px',
    );
  });

  test('returns to the default after a double click on the edge of the header', async ({
    api,
    library,
    dataExplorer,
  }) => {
    const { id } = await api.defineExploration(library.books, {
      name: uniqueName('Book lengths'),
      columns: ['Title', 'Pages'],
      displayOptions: {
        columnDisplayOptions: {
          '1': {
            column: {
              name: 'Books_Pages',
              type: { name: 'integer' },
              index: 1,
            },
            displayOptions: { display_width: 300 },
          },
        },
      },
    });
    const { results } = dataExplorer;
    const header = results.sheet.columnHeader('Books_Pages');
    await dataExplorer.gotoSaved(library.books.schema, id);
    await expect(header).toHaveCSS('width', '300px');

    await results.columnResizer('Books_Pages').dblclick();

    await expect(header).toHaveCSS('width', '160px');
    await expect(dataExplorer.unsavedMark).toBeVisible();
  });

  test('survives a change of the column type in PostgreSQL, which the page stores without a click on "Save"', async ({
    api,
    schema,
    library,
    dataExplorer,
  }) => {
    const name = uniqueName('Book lengths');
    const { id } = await api.defineExploration(library.books, {
      name,
      columns: ['Title', 'Pages'],
      displayOptions: {
        columnDisplayOptions: {
          '1': {
            column: {
              name: 'Books_Pages',
              type: { name: 'integer' },
              index: 1,
            },
            displayOptions: { display_width: 300 },
          },
        },
      },
    });
    await runSqlInSchema(
      schema,
      'ALTER TABLE "Books" ALTER COLUMN "Pages" TYPE numeric',
    );

    await dataExplorer.gotoSaved(schema, id);

    await expect(
      dataExplorer.results.sheet.columnHeader('Books_Pages'),
    ).toHaveCSS('width', '300px');
    await expect
      .poll(
        async () => (await api.findExploration(schema, name))?.displayOptions,
      )
      .toEqual({
        columnDisplayOptions: {
          '1': {
            column: {
              name: 'Books_Pages',
              type: { name: 'numeric' },
              index: 1,
            },
            displayOptions: { display_width: 300 },
          },
        },
      });
    await expect(dataExplorer.saveButton).toBeDisabled();
  });
});
