import { runSqlInSchema } from '../../support/api/mathesar';
import { quoteIdentifier } from '../../support/api/postgres';
import { holdRpcCalls } from '../../support/held-requests';
import { pinsKnownBug } from '../../support/known-bugs';
import { failRpcMethod } from '../../support/rpc-failures';
import { recordRpcCalls } from '../../support/rpc-log';
import { Breadcrumb } from '../../support/ui/components/breadcrumb';
import { Toasts } from '../../support/ui/components/toast';
import { ImportPreviewPage } from '../../support/ui/pages/import-preview-page';
import { TablePage } from '../../support/ui/pages/table-page';
import { schemaUrl, tableUrl } from '../../support/ui/urls';
import {
  expect,
  storedColumns,
  storedRecords,
  storedTableNames,
  test,
} from './fixtures';

const BOOKS_COLUMNS: [string, string][] = [
  ['id', 'Number'],
  ['Title', 'Text'],
  ['Pages', 'Number'],
  ['Published', 'Date'],
];

const BOOKS_CELLS = [
  ...['1', 'Dune', '412', '08/01/1965'],
  ...['2', 'Emma', '474', '12/23/1815'],
  ...['3', 'Ulysses', '730', '02/02/1922'],
];

const BOOKS_CELLS_AS_TEXT = [
  ...['1', 'Dune', '412', '1965-08-01'],
  ...['2', 'Emma', '474', '1815-12-23'],
  ...['3', 'Ulysses', '730', '1922-02-02'],
];

test.describe('import preview', () => {
  test('includes every column of the file and locks the primary key column', async ({
    page,
    openPreview,
    previewPage,
  }) => {
    await openPreview('books.csv');

    await expect(page).toHaveTitle('Import | Mathesar');
    for (const position of [0, 1, 2, 3]) {
      await expect(previewPage.column(position).included).toBeChecked();
    }
    await expect(previewPage.column(0).included).toBeDisabled();
    await expect(previewPage.column(0).type).toBeDisabled();
    await expect(previewPage.column(1).included).toBeEnabled();
    await expect(previewPage.column(1).type).toBeEnabled();
    await expect(previewPage.cells).toHaveText(BOOKS_CELLS);
    await expect(previewPage.truncationNote).toBeHidden();
  });

  test('loads the preview once, with the suggested types', async ({
    page,
    startImport,
    previewPage,
  }) => {
    const table = await startImport('books.csv');
    const rpcCalls = recordRpcCalls(page);
    await previewPage.goto(table);

    await expect(previewPage.confirmButton).toBeEnabled();
    expect(rpcCalls).toEqual([
      'tables.get_with_metadata',
      'columns.list_with_metadata',
      'data_modeling.suggest_types',
      'tables.get_import_preview',
    ]);
  });

  test('marks the primary key column that Mathesar added', async ({
    openPreview,
    previewPage,
  }) => {
    await openPreview('books.csv');
    const { marks } = previewPage.column(0);

    await marks.nth(0).hover();
    await expect(previewPage.tooltip).toHaveText(
      'This is the primary key column.',
    );
    await marks.nth(1).hover();
    await expect(previewPage.tooltip).toHaveText([
      'This column was automatically added by Mathesar.',
    ]);
    await expect(previewPage.column(1).marks).toHaveCount(0);
  });

  test('shows the first 20 rows of a longer file and imports all of them', async ({
    openPreview,
    previewPage,
    schema,
  }) => {
    await openPreview('twenty-five-rows.csv');

    await expect(previewPage.rows).toHaveCount(20);
    await expect(previewPage.rows.last()).toContainText('400');
    await expect(previewPage.truncationNote).toBeVisible();
    expect(await storedRecords(schema, 'twenty-five-rows')).toHaveLength(25);
  });

  test(
    'shows two rows of placeholders for a file without data rows',
    pinsKnownBug('import-preview-phantom-rows'),
    async ({ openPreview, previewPage }) => {
      await openPreview('header-only.csv');

      await expect(previewPage.cells).toHaveText(
        Array<string>(6).fill('DEFAULT'),
      );
    },
  );

  test.fixme('shows no rows for a file without data rows', async ({
    openPreview,
    previewPage,
  }) => {
    await openPreview('header-only.csv');

    await expect(previewPage.columns).toHaveCount(3);
    await expect(previewPage.rows).toHaveCount(0);
  });

  test.describe('table name', () => {
    test('must differ from the names of the other tables', async ({
      schema,
      openPreview,
      previewPage,
    }) => {
      await runSqlInSchema(schema, 'CREATE TABLE "Authors" (id integer)');
      await openPreview('books.csv');
      await previewPage.tableName.fill('Authors');

      await expect(previewPage.tableNameErrors).toHaveText(
        'A table with that name already exists.',
      );
      await expect(previewPage.confirmButton).toBeDisabled();
    });

    test('is required', async ({ openPreview, previewPage }) => {
      await openPreview('books.csv');
      await previewPage.tableName.fill('');

      await expect(previewPage.tableNameErrors).toHaveText(
        'Value cannot be empty.',
      );
      await expect(previewPage.confirmButton).toBeDisabled();

      await previewPage.tableName.fill('books');
      await expect(previewPage.tableNameErrors).toBeHidden();
      await expect(previewPage.confirmButton).toBeEnabled();
    });
  });

  test.describe('choices for the whole file', () => {
    test('without the header row, the file is imported again with generic column names', async ({
      page,
      openPreview,
      previewPage,
      schema,
    }) => {
      const table = await openPreview('books.csv');
      await previewPage.tableName.fill('Classics');
      const rpcCalls = recordRpcCalls(page);
      await previewPage.genericNamesOption.check();

      await expect(page).not.toHaveURL(previewPage.url(table));
      await previewPage.expectColumns([
        ['id', 'Number'],
        ['Column 0', 'Text'],
        ['Column 1', 'Text'],
        ['Column 2', 'Text'],
      ]);
      await expect(previewPage.cells).toHaveText([
        ...['1', 'Title', 'Pages', 'Published'],
        ...['2', 'Dune', '412', '1965-08-01'],
        ...['3', 'Emma', '474', '1815-12-23'],
        ...['4', 'Ulysses', '730', '1922-02-02'],
      ]);
      await expect(previewPage.tableName).toHaveValue('Classics');
      expect(rpcCalls).toEqual([
        'tables.delete',
        'tables.import',
        'tables.metadata.set',
        'tables.get_with_metadata',
        'columns.list_with_metadata',
        'data_modeling.suggest_types',
        'tables.get_import_preview',
      ]);
      expect(await storedTableNames(schema)).toEqual(['Classics']);

      await page.reload();
      await expect(previewPage.genericNamesOption).toBeChecked();
    });

    test('with the header row turned back on, the first row names the columns again', async ({
      page,
      openPreview,
      previewPage,
      schema,
    }) => {
      const table = await openPreview('books.csv', { header: false });
      await expect(previewPage.genericNamesOption).toBeChecked();
      await previewPage.headerRowOption.check();

      await expect(page).not.toHaveURL(previewPage.url(table));
      await previewPage.expectColumns(BOOKS_COLUMNS);
      await expect(previewPage.cells).toHaveText(BOOKS_CELLS);
      expect(await storedColumns(schema, 'books')).toEqual([
        { name: 'id', type: 'integer' },
        { name: 'Title', type: 'text' },
        { name: 'Pages', type: 'text' },
        { name: 'Published', type: 'text' },
      ]);
    });

    test('without type inference, every column is text and the table stays', async ({
      page,
      openPreview,
      previewPage,
    }) => {
      const table = await openPreview('books.csv');
      const rpcCalls = recordRpcCalls(page);
      await previewPage.allTextOption.check();

      await expect(page).toHaveURL(previewPage.url(table, false));
      await previewPage.expectColumns([
        ['id', 'Number'],
        ['Title', 'Text'],
        ['Pages', 'Text'],
        ['Published', 'Text'],
      ]);
      await expect(previewPage.cells).toHaveText(BOOKS_CELLS_AS_TEXT);
      expect(rpcCalls).toEqual([
        'columns.list_with_metadata',
        'tables.get_import_preview',
      ]);
    });

    test('switching type inference keeps the table name and discards the column changes', async ({
      openPreview,
      previewPage,
    }) => {
      await openPreview('books.csv');
      await previewPage.tableName.fill('Classics');
      await previewPage.column(1).name.fill('Name');
      await previewPage.column(2).included.uncheck();
      await previewPage.allTextOption.check();

      await expect(previewPage.cells).toHaveText(BOOKS_CELLS_AS_TEXT);
      await expect(previewPage.tableName).toHaveValue('Classics');
      await expect(previewPage.column(1).name).toHaveValue('Title');
      await expect(previewPage.column(2).included).toBeChecked();
    });
  });

  test.describe('columns', () => {
    test('a renamed column keeps its new name in the table', async ({
      page,
      openPreview,
      previewPage,
      schema,
    }) => {
      const table = await openPreview('books.csv');
      await previewPage.column(1).name.fill('Name');
      await previewPage.confirmButton.click();

      await expect(page).toHaveURL(tableUrl(table));
      expect(await storedColumns(schema, 'books')).toEqual([
        { name: 'id', type: 'integer' },
        { name: 'Name', type: 'text' },
        { name: 'Pages', type: 'numeric' },
        { name: 'Published', type: 'date' },
      ]);
    });

    test('a column name left blank goes back to the name from the file', async ({
      openPreview,
      previewPage,
    }) => {
      await openPreview('books.csv');
      const { name } = previewPage.column(1);
      await name.fill(' ');
      await expect(name).toHaveValue(' ');
      await name.blur();

      await expect(name).toHaveValue('Title');
    });

    test('an unchecked column is left out of the table', async ({
      page,
      openPreview,
      previewPage,
      schema,
    }) => {
      const table = await openPreview('books.csv');
      await previewPage.column(2).included.uncheck();
      await previewPage.confirmButton.click();

      await expect(page).toHaveURL(tableUrl(table));
      expect(await storedColumns(schema, 'books')).toEqual([
        { name: 'id', type: 'integer' },
        { name: 'Title', type: 'text' },
        { name: 'Published', type: 'date' },
      ]);
    });

    test('a new type changes the preview and the stored type', async ({
      page,
      openPreview,
      previewPage,
      schema,
    }) => {
      const table = await openPreview('books.csv');
      const published = previewPage.column(3);
      const rpcCalls = recordRpcCalls(page);
      await previewPage.changeType(published, 'Text');

      await expect(previewPage.typeOptions.root).toBeHidden();
      await expect(published.type).toHaveText('Text');
      await expect(previewPage.cells).toHaveText(BOOKS_CELLS_AS_TEXT);
      expect(rpcCalls).toEqual(['tables.get_import_preview']);

      await previewPage.confirmButton.click();
      await expect(page).toHaveURL(tableUrl(table));
      expect(await storedColumns(schema, 'books')).toContainEqual({
        name: 'Published',
        type: 'text',
      });
    });

    test('a new type keeps the names and the choices of the other columns', async ({
      openPreview,
      previewPage,
    }) => {
      await openPreview('books.csv');
      await previewPage.column(1).name.fill('Name');
      await previewPage.column(2).included.uncheck();
      await previewPage.changeType(previewPage.column(3), 'Text');

      await expect(previewPage.cells).toHaveText(BOOKS_CELLS_AS_TEXT);
      await expect(previewPage.column(1).name).toHaveValue('Name');
      await expect(previewPage.column(2).included).not.toBeChecked();
    });

    test('are locked while the preview loads again', async ({
      page,
      openPreview,
      previewPage,
    }) => {
      await openPreview('books.csv');
      const finishPreview = await holdRpcCalls(
        page,
        'tables.get_import_preview',
      );
      await previewPage.changeType(previewPage.column(3), 'Text');

      const title = previewPage.column(1);
      await expect(title.included).toBeDisabled();
      await expect(title.name).toBeDisabled();
      await expect(title.type).toBeDisabled();
      await expect(previewPage.headerRowOption).toBeDisabled();
      await expect(previewPage.confirmButton).toBeDisabled();
      finishPreview();
      await expect(title.included).toBeEnabled();
      await expect(previewPage.confirmButton).toBeEnabled();
    });

    test('Cancel in the type options keeps the type', async ({
      openPreview,
      previewPage,
    }) => {
      await openPreview('books.csv');
      const published = previewPage.column(3);
      await published.type.click();
      await previewPage.typeOptions.choose('Text');
      await previewPage.typeOptions.cancelButton.click();

      await expect(previewPage.typeOptions.root).toBeHidden();
      await expect(published.type).toHaveText('Date');
      await expect(previewPage.cells).toHaveText(BOOKS_CELLS);
    });
  });

  test.describe('a type that does not fit the values', () => {
    test.beforeEach(async ({ openPreview, previewPage }) => {
      await openPreview('books.csv');
      await previewPage.changeType(previewPage.column(1), 'Number');
    });

    test('is reported in place of the preview and blocks Confirm', async ({
      previewPage,
    }) => {
      await expect(previewPage.error).toContainText('Failed to load preview');
      await expect(previewPage.error).toContainText(
        'RaiseException: Dune cannot be cast to numeric SQLSTATE: P0001',
      );
      await expect(previewPage.confirmButton).toBeDisabled();
    });

    test('Retry loads the preview again with the suggested types', async ({
      previewPage,
    }) => {
      await previewPage.retryButton.click();

      await previewPage.expectColumns(BOOKS_COLUMNS);
      await expect(previewPage.cells).toHaveText(BOOKS_CELLS);
      await expect(previewPage.confirmButton).toBeEnabled();
    });

    test('Delete Import drops the table and opens the schema page', async ({
      page,
      previewPage,
      schema,
    }) => {
      await previewPage.deleteImportButton.click();

      await expect(page).toHaveURL(schemaUrl(schema));
      expect(await storedTableNames(schema)).toEqual([]);
    });
  });

  test.describe('confirmation', () => {
    test('Confirm creates the table with the suggested types and opens it', async ({
      page,
      api,
      openPreview,
      previewPage,
      schema,
    }) => {
      const table = await openPreview('books.csv');
      const rpcCalls = recordRpcCalls(page);
      await previewPage.confirmButton.click();

      await expect(page).toHaveURL(tableUrl(table));
      await expect(new TablePage(page).heading).toHaveText('books');
      expect(rpcCalls.slice(0, 4)).toEqual([
        'tables.patch',
        'columns.patch',
        'tables.metadata.set',
        'tables.get_with_metadata',
      ]);
      expect(await storedColumns(schema, 'books')).toEqual([
        { name: 'id', type: 'integer' },
        { name: 'Title', type: 'text' },
        { name: 'Pages', type: 'numeric' },
        { name: 'Published', type: 'date' },
      ]);
      expect(await storedRecords(schema, 'books')).toEqual([
        { id: 1, Title: 'Dune', Pages: 412, Published: '1965-08-01' },
        { id: 2, Title: 'Emma', Pages: 474, Published: '1815-12-23' },
        { id: 3, Title: 'Ulysses', Pages: 730, Published: '1922-02-02' },
      ]);
      expect(await api.isImportConfirmed(table)).toBe(true);
    });

    test('Confirm and Cancel are disabled while the table is created', async ({
      page,
      openPreview,
      previewPage,
    }) => {
      const table = await openPreview('books.csv');
      const finishCreation = await holdRpcCalls(page, 'tables.patch');
      await previewPage.confirmButton.click();

      await expect(previewPage.confirmButton).toBeDisabled();
      await expect(previewPage.cancelButton).toBeDisabled();
      finishCreation();
      await expect(page).toHaveURL(tableUrl(table));
    });

    test(
      'a failed confirmation still applies the changes that succeeded',
      pinsKnownBug('import-confirm-partly-applied'),
      async ({ page, api, openPreview, previewPage, schema }) => {
        const table = await openPreview('books.csv');
        await previewPage.tableName.fill('Classics');
        await previewPage.column(2).name.fill('Title');
        await previewPage.column(3).included.uncheck();
        await previewPage.confirmButton.click();

        await new Toasts(page).expectMessage(
          'DuplicateColumn: column "Title" of relation "Classics" already exists SQLSTATE: 42701',
        );
        await expect(page).toHaveURL(previewPage.url(table));
        expect(await storedColumns(schema, 'Classics')).toEqual([
          { name: 'id', type: 'integer' },
          { name: 'Title', type: 'text' },
          { name: 'Pages', type: 'text' },
        ]);
        expect(await api.isImportConfirmed(table)).toBe(true);
      },
    );

    test.fixme('a failed confirmation changes nothing', async ({
      page,
      api,
      openPreview,
      previewPage,
      schema,
    }) => {
      const table = await openPreview('books.csv');
      await previewPage.tableName.fill('Classics');
      await previewPage.column(2).name.fill('Title');
      await previewPage.column(3).included.uncheck();
      await previewPage.confirmButton.click();

      await new Toasts(page).expectMessage(/already exists/);
      await expect(page).toHaveURL(previewPage.url(table));
      expect(await storedColumns(schema, 'books')).toEqual([
        { name: 'id', type: 'integer' },
        { name: 'Title', type: 'text' },
        { name: 'Pages', type: 'text' },
        { name: 'Published', type: 'text' },
      ]);
      expect(await api.isImportConfirmed(table)).toBe(false);
    });

    test('Cancel deletes the table and opens the schema page', async ({
      page,
      openPreview,
      previewPage,
      schema,
    }) => {
      await openPreview('books.csv');
      const finishDeletion = await holdRpcCalls(page, 'tables.delete');
      await previewPage.cancelButton.click();

      await expect(previewPage.cleaningUpNote).toBeVisible();
      await expect(previewPage.confirmButton).toBeHidden();
      finishDeletion();
      await expect(page).toHaveURL(schemaUrl(schema));
      expect(await storedTableNames(schema)).toEqual([]);
    });

    test(
      'Cancel reports a failed deletion without its reason and keeps the preview',
      pinsKnownBug('import-cancel-error-message-lost'),
      async ({ page, openPreview, previewPage, schema }) => {
        const table = await openPreview('books.csv');
        await failRpcMethod(page, 'tables.delete', 'The table is in use.');
        await previewPage.cancelButton.click();

        await expect(new Toasts(page).items).toHaveText([
          'Something went wrong.',
        ]);
        await expect(page).toHaveURL(previewPage.url(table));
        await expect(previewPage.cancelButton).toBeEnabled();
        expect(await storedTableNames(schema)).toEqual(['books']);
      },
    );

    test.fixme('Cancel reports why the deletion failed', async ({
      page,
      openPreview,
      previewPage,
    }) => {
      const table = await openPreview('books.csv');
      await failRpcMethod(page, 'tables.delete', 'The table is in use.');
      await previewPage.cancelButton.click();

      await new Toasts(page).expectMessage('The table is in use.');
      await expect(page).toHaveURL(previewPage.url(table));
    });

    test('leaving the preview keeps the table as an import to confirm', async ({
      page,
      api,
      openPreview,
      schema,
    }) => {
      const table = await openPreview('books.csv');
      await new Breadcrumb(page).item(schema.name).click();

      await expect(page).toHaveURL(schemaUrl(schema));
      expect(await storedTableNames(schema)).toEqual(['books']);
      expect(await api.isImportConfirmed(table)).toBe(false);
    });
  });

  test.describe('preview address', () => {
    test('opens the table page for a table that is not waiting for confirmation', async ({
      page,
      api,
      schema,
      previewPage,
    }) => {
      await runSqlInSchema(schema, 'CREATE TABLE "Authors" (id integer)');
      const table = await api.getTable(schema, 'Authors');
      await previewPage.goto(table);

      await expect(page).toHaveURL(tableUrl(table));
    });

    test('says that the preview cannot be loaded for a table that is gone', async ({
      api,
      schema,
      previewPage,
    }) => {
      await runSqlInSchema(schema, 'CREATE TABLE "Authors" (id integer)');
      const table = await api.getTable(schema, 'Authors');
      await runSqlInSchema(schema, 'DROP TABLE "Authors"');
      await previewPage.goto(table);

      await expect(previewPage.error).toContainText(
        'Unable to load table preview',
      );
      await expect(previewPage.error).toContainText(
        "TypeError: 'NoneType' object is not iterable",
      );
    });

    test('says that the preview cannot be loaded for another user', async ({
      schema,
      startImport,
      collaborator: { user, role },
      signInAs,
    }) => {
      const table = await startImport('books.csv');
      await runSqlInSchema(
        schema,
        `GRANT USAGE ON SCHEMA ${quoteIdentifier(schema.name)} TO ${quoteIdentifier(role.name)};
         GRANT SELECT ON books TO ${quoteIdentifier(role.name)}`,
      );
      const otherUsersPreview = new ImportPreviewPage(await signInAs(user));
      await otherUsersPreview.goto(table);

      await expect(otherUsersPreview.error).toContainText(
        'Unable to load table preview',
      );
      await expect(otherUsersPreview.error).toContainText(
        'No DataFile matches the given query.',
      );
    });
  });
});
