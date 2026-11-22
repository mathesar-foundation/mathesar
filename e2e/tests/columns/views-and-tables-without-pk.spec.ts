import { type Table, runSqlInSchema } from '../../support/api/mathesar';
import { pinsKnownBug } from '../../support/known-bugs';
import { menuItem, openMenu } from '../../support/ui/components/menu';
import { NewColumnDropdown } from '../../support/ui/components/new-column-dropdown';
import { Toasts } from '../../support/ui/components/toast';
import { expectStaysOpen } from '../../support/ui/components/transitions';
import { ColumnInspector } from '../../support/ui/pages/column-inspector';
import { TablePage } from '../../support/ui/pages/table-page';
import { TableTab } from '../../support/ui/pages/table-tab';
import { test as base, expect, storedColumns } from './fixtures';

interface ViewFixtures {
  /** A view of `books` with the columns id, Title and Pages of the long books. */
  longBooks: Table;
  /** The table page of `longBooks`, loaded. */
  viewPage: TablePage;
}

const test = base.extend<ViewFixtures>({
  longBooks: async ({ api, books }, use) => {
    await runSqlInSchema(
      books.schema,
      `CREATE VIEW "Long Books" AS
         SELECT id, "Title", "Pages" FROM "Books" WHERE "Pages" > 400`,
    );
    await use(await api.getTable(books.schema, 'Long Books'));
  },

  viewPage: async ({ page, longBooks }, use) => {
    const viewPage = new TablePage(page);
    await viewPage.goto(longBooks);
    await use(viewPage);
  },
});

test.describe('the inspector of a view', () => {
  test('the View tab offers the name, the permissions and the actions only', async ({
    page,
    viewPage,
  }) => {
    const viewTab = new TableTab(page, viewPage.inspector);

    await expect(viewTab.sectionHeaders).toHaveText([
      'View Properties',
      'Actions',
    ]);
    await expect(viewTab.name.input).toHaveValue('Long Books');
    await expect(viewTab.name.input).toBeEnabled();
    await expect(viewTab.permissionsButton).toHaveText('View Permissions');
    await expect(viewTab.description.input).toHaveCount(0);
    await expect(viewTab.deleteButton).toHaveCount(0);
  });

  test('the Column tab offers no constraints, default value or actions, and no change of type', async ({
    page,
    viewPage,
  }) => {
    const columnInspector = new ColumnInspector(page, viewPage.inspector);
    await viewPage.sheet.columnHeader('Title').click();

    await expect(columnInspector.name.input).toHaveValue('Title');
    await expect(columnInspector.sectionHeaders).toHaveText([
      'Column Properties',
      'Data Type',
      'Formatting',
    ]);
    await expect(columnInspector.uniqueCheckbox).toHaveCount(0);
    await expect(columnInspector.notNullCheckbox).toHaveCount(0);
    await expect(columnInspector.dataType.select).toBeDisabled();
    await expect(columnInspector.dataType.maxLengthCheckbox).toBeDisabled();
  });

  test('renames a column of the view', async ({ page, books, viewPage }) => {
    const { name } = new ColumnInspector(page, viewPage.inspector);
    await viewPage.sheet.columnHeader('Title').click();
    await name.input.click();
    await name.input.fill('Heading');
    await name.saveButton.click();

    await expect(viewPage.sheet.columnHeaders).toHaveText([
      'id',
      'Heading',
      'Pages',
    ]);
    expect(
      (await storedColumns(books.schema, 'Long Books')).map(({ name }) => name),
    ).toEqual(['id', 'Heading', 'Pages']);
  });
});

test.describe('the structure of a view', () => {
  test(
    'a view offers New Column, which the database refuses',
    pinsKnownBug('view-offers-new-column'),
    async ({ page, books, viewPage: { sheet } }) => {
      const newColumn = new NewColumnDropdown(page);
      await sheet.newColumnButton.click();
      await newColumn.name.fill('Extra');
      await newColumn.addButton.click();

      await expect(newColumn.submitErrors).toContainText(
        'WrongObjectType: ALTER action ADD COLUMN cannot be performed on relation "Long Books"',
      );
      await expectStaysOpen(newColumn.root);
      await expect(sheet.columnHeaders).toHaveText(['id', 'Title', 'Pages']);
      expect(
        (await storedColumns(books.schema, 'Long Books')).map(
          ({ name }) => name,
        ),
      ).toEqual(['id', 'Title', 'Pages']);
    },
  );

  test.fixme('a view offers no New Column', async ({ viewPage: { sheet } }) => {
    await expect(sheet.newColumnButton).toHaveCount(0);
  });

  test(
    'the menu of a column header of a view offers Delete Column, which the database refuses',
    pinsKnownBug('view-offers-delete-column'),
    async ({ page, viewPage }) => {
      const { sheet } = viewPage;
      const { deleteModal } = new ColumnInspector(page, viewPage.inspector);
      await sheet.columnHeader('Pages').click({ button: 'right' });
      await menuItem(page, 'Delete Column').click();
      await deleteModal.button('Delete Column').click();

      await new Toasts(page).expectMessage(
        'Unable to delete Column. WrongObjectType: ALTER action DROP COLUMN cannot be performed on relation "Long Books"',
      );
      await expect(sheet.columnHeaders).toHaveText(['id', 'Title', 'Pages']);
    },
  );

  test.fixme('the menu of a column header of a view offers no Delete Column', async ({
    page,
    viewPage: { sheet },
  }) => {
    await sheet.columnHeader('Pages').click({ button: 'right' });

    await expect(openMenu(page).getByRole('menuitem')).toHaveText([
      'Filter Column',
      'Sort 0-9',
      'Sort 9-0',
      'Group by Column',
      'Hide Column',
    ]);
  });
});

test.describe('a table without a primary key', () => {
  test('gets a new column through the New Column form', async ({
    page,
    api,
    schema,
  }) => {
    await runSqlInSchema(
      schema,
      `CREATE TABLE "Log" ("Message" text, "Level" integer);
       INSERT INTO "Log" VALUES ('started', 1), ('stopped', 2);`,
    );
    const tablePage = new TablePage(page);
    await tablePage.goto(await api.getTable(schema, 'Log'));
    const newColumn = new NewColumnDropdown(page);
    await tablePage.sheet.newColumnButton.click();
    await newColumn.name.fill('Source');
    await newColumn.addButton.click();

    await expect(tablePage.sheet.columnHeaders).toHaveText([
      'Message',
      'Level',
      'Source',
    ]);
    await expect(tablePage.sheet.cell(0, 'Source')).toHaveText('NULL');
    expect(
      (await storedColumns(schema, 'Log')).map(({ name }) => name),
    ).toEqual(['Message', 'Level', 'Source']);
  });
});
