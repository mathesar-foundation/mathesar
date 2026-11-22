import { runSqlInSchema } from '../../support/api/mathesar';
import { writeClipboardText } from '../../support/ui/clipboard';
import { ConstraintsModal } from '../../support/ui/components/constraints-modal';
import { dismissContextMenu, menuItem } from '../../support/ui/components/menu';
import { Modal } from '../../support/ui/components/modal';
import { retryButton } from '../../support/ui/components/status-bar';
import { ColumnInspector } from '../../support/ui/pages/column-inspector';
import { GatedTablePage } from '../../support/ui/pages/privilege-gated-pages';
import { TablePage } from '../../support/ui/pages/table-page';
import { TableTab } from '../../support/ui/pages/table-tab';
import { tableUrl } from '../../support/ui/urls';
import { test as base, expect, storedBooks } from './fixtures';
import { grantOnSchema, grantOnTable, makeOwnerOfTable } from './privileges';

interface TableAccessFixtures {
  /**
   * Opens "Books" as the collaborator. The role gets these privileges on the
   * table, as in GRANT, and USAGE on the schema.
   */
  openBooksWith: (privileges: string) => Promise<TablePage>;
}

const test = base.extend<TableAccessFixtures>({
  openBooksWith: async ({ books, collaborator, signInAs }, use) => {
    await use(async (privileges) => {
      await grantOnSchema(books.schema, collaborator.role.name, 'USAGE');
      await grantOnTable(books, collaborator.role.name, privileges);
      const tablePage = new TablePage(await signInAs(collaborator.user));
      await tablePage.goto(books);
      return tablePage;
    });
  },
});

test.describe('what a standard user may do with a table', () => {
  test('shows only a warning without SELECT', async ({
    books,
    signInAs,
    collaborator: { user, role },
  }) => {
    await grantOnSchema(books.schema, role.name, 'USAGE');
    const page = await signInAs(user);
    const tablePage = new GatedTablePage(page);
    await page.goto(tableUrl(books));

    await expect(tablePage.heading).toHaveText('Books');
    await expect(tablePage.noSelectWarning).toBeVisible();
    await expect(tablePage.toolbarButton('Filter')).toHaveCount(0);
    await expect(tablePage.sheet.columnHeaders).toHaveCount(0);
    await expect(tablePage.inspector.root).toHaveCount(0);
  });

  test('shows an empty sheet with SELECT in a schema without USAGE', async ({
    books,
    signInAs,
    collaborator: { user, role },
  }) => {
    await grantOnTable(books, role.name, 'SELECT');
    const page = await signInAs(user);
    const tablePage = new TablePage(page);
    await page.goto(tableUrl(books));

    await expect(tablePage.sheet.columnHeader('Title')).toBeVisible();
    await expect(tablePage.recordCount).toHaveText('No records found');
    await expect(retryButton(tablePage)).toBeVisible();
    await expect(tablePage.sheet.recordRows).toHaveCount(0);
  });

  test.describe('with SELECT only', () => {
    let tablePage: TablePage;

    test.beforeEach(async ({ openBooksWith }) => {
      tablePage = await openBooksWith('SELECT');
    });

    test('shows the records without a way to add one', async () => {
      const { page, sheet } = tablePage;
      await expect(sheet.recordRows).toHaveCount(3);
      await expect(tablePage.newRecordButton).toHaveCount(0);
      await expect(sheet.placeholderRow).toHaveCount(0);
      await expect(tablePage.inspector.button('Import')).toBeDisabled();

      await sheet.cell(0, 'Title').click({ button: 'right' });
      await menuItem(page, 'Row').hover();
      await expect(menuItem(page, 'Quick View Record')).toBeVisible();
      await expect(menuItem(page, 'Duplicate Record')).toHaveCount(0);
    });

    test('does not open an editor on a cell', async () => {
      const { page, sheet } = tablePage;
      const cell = sheet.cell(0, 'Title');
      await cell.click();
      await expect(cell).toHaveAttribute('data-cell-active');
      await page.keyboard.press('Enter');
      await expect(sheet.editor).toHaveCount(0);

      await cell.click({ button: 'right' });
      await expect(menuItem(page, 'Set to NULL')).toBeDisabled();
    });

    test('shows a record read-only in the quick view', async () => {
      const { page, sheet } = tablePage;
      await sheet.cell(0, 'Title').click({ button: 'right' });
      await menuItem(page, 'Row').hover();
      await menuItem(page, 'Quick View Record').click();

      await expect(tablePage.recordModalField('Title')).toHaveValue('Dune');
      await expect(tablePage.recordModalField('Title')).toBeDisabled();
    });

    test('offers no way to delete a record', async () => {
      const { page, sheet } = tablePage;
      await sheet.cell(0, 'Title').click({ button: 'right' });
      await menuItem(page, 'Row').hover();
      await expect(menuItem(page, 'Quick View Record')).toBeVisible();
      await expect(menuItem(page, 'Delete Record')).toHaveCount(0);

      await dismissContextMenu(page);
      await tablePage.inspector.tab('Record').click();
      await expect(tablePage.inspector.button('Delete Record')).toBeDisabled();
    });
  });

  test('adds an empty record with INSERT and offers the other ways to add records', async ({
    books,
    openBooksWith,
  }) => {
    const tablePage = await openBooksWith('SELECT, INSERT');
    const { page, sheet } = tablePage;
    await expect(sheet.placeholderRow).toHaveCount(1);
    await expect(tablePage.inspector.button('Import')).toBeEnabled();
    await sheet.cell(0, 'Title').click({ button: 'right' });
    await menuItem(page, 'Row').hover();
    await expect(menuItem(page, 'Duplicate Record')).toBeVisible();
    await dismissContextMenu(page);
    await tablePage.newRecordButton.click();

    await expect(tablePage.sheet.recordRows).toHaveCount(4);
    await expect
      .poll(() => storedBooks(books))
      .toContainEqual({ id: 4, Title: null, Pages: null });
  });

  test('does not open an editor in the placeholder row with INSERT but no UPDATE', async ({
    openBooksWith,
  }) => {
    const { page, sheet } = await openBooksWith('SELECT, INSERT');
    const cell = sheet.placeholderCell('Title');
    await cell.click();
    await expect(cell).toHaveAttribute('data-cell-active');
    await page.keyboard.press('Enter');

    await expect(sheet.editor).toHaveCount(0);
  });

  test('edits a cell with UPDATE, without ways to add or delete records', async ({
    books,
    openBooksWith,
  }) => {
    const tablePage = await openBooksWith('SELECT, UPDATE');
    const { page, sheet } = tablePage;
    const cell = sheet.cell(0, 'Title');
    await sheet.editCell(cell, 'Dune Messiah');

    await expect(cell).toHaveText('Dune Messiah');
    await expect
      .poll(() => storedBooks(books))
      .toContainEqual({ id: 1, Title: 'Dune Messiah', Pages: 412 });
    await expect(tablePage.newRecordButton).toHaveCount(0);
    await expect(sheet.placeholderRow).toHaveCount(0);
    await cell.click({ button: 'right' });
    await expect(menuItem(page, 'Set to NULL')).toBeEnabled();
    await menuItem(page, 'Row').hover();
    await expect(menuItem(page, 'Quick View Record')).toBeVisible();
    await expect(menuItem(page, 'Delete Record')).toHaveCount(0);
  });

  test('pastes into the last record but keeps the rows past it unsaved without INSERT', async ({
    books,
    openBooksWith,
  }) => {
    const tablePage = await openBooksWith('SELECT, UPDATE');
    const { page, sheet } = tablePage;
    await writeClipboardText(page, 'Kindred\nPersuasion');
    await sheet.cell(sheet.rowContaining('Ulysses'), 'Title').click();
    await page.keyboard.press('Control+v');
    await new Modal(page, 'Paste 2 cells?').button('Paste').click();

    const unsaved = sheet.cell(sheet.rowContaining('Persuasion'), 'Title');
    await expect(sheet.errorIndicator(unsaved)).toBeVisible();
    await expect(sheet.cell(2, 'Title')).toHaveText('Kindred');
    await expect(tablePage.recordCount).toHaveText(
      'Showing 1–3 of 3 +1 unsaved',
    );
    await unsaved.hover();
    await expect(sheet.cellErrors).toContainText(
      'permission denied for table Books',
    );
    await expect
      .poll(() => storedBooks(books))
      .toEqual([
        { id: 1, Title: 'Dune', Pages: 412 },
        { id: 2, Title: 'Emma', Pages: 320 },
        { id: 3, Title: 'Kindred', Pages: 730 },
      ]);
  });

  test('edits only the column that the role may update', async ({
    books,
    openBooksWith,
  }) => {
    const { page, sheet } = await openBooksWith('SELECT, UPDATE ("Pages")');
    const row = sheet.rowContaining('Dune');
    await sheet.cell(row, 'Title').click();
    await expect(sheet.cell(row, 'Title')).toHaveAttribute('data-cell-active');
    await page.keyboard.press('Enter');
    await expect(sheet.editor).toHaveCount(0);
    await sheet.cell(row, 'Title').click({ button: 'right' });
    await expect(menuItem(page, 'Set to NULL')).toBeDisabled();
    await dismissContextMenu(page);

    await sheet.editFormattedCell(sheet.cell(row, 'Pages'), '500');
    await expect(sheet.cell(row, 'Pages')).toHaveText('500');
    await expect
      .poll(() => storedBooks(books))
      .toContainEqual({ id: 1, Title: 'Dune', Pages: 500 });
  });

  test('deletes a record with DELETE, without ways to add or edit records', async ({
    books,
    openBooksWith,
  }) => {
    const tablePage = await openBooksWith('SELECT, DELETE');
    const { page, sheet } = tablePage;
    await expect(tablePage.newRecordButton).toHaveCount(0);
    const cell = sheet.cell(sheet.rowContaining('Emma'), 'Title');
    await cell.click();
    await expect(cell).toHaveAttribute('data-cell-active');
    await page.keyboard.press('Enter');
    await expect(sheet.editor).toHaveCount(0);

    await cell.click({ button: 'right' });
    await menuItem(page, 'Row').hover();
    await menuItem(page, 'Delete Record').click();
    await tablePage.deleteRecordsModal.button('Yes').click();

    await expect(sheet.rowContaining('Emma')).toHaveCount(0);
    await expect(sheet.recordRows).toHaveCount(2);
    await expect
      .poll(async () => (await storedBooks(books)).map(({ Title }) => Title))
      .toEqual(['Dune', 'Ulysses']);
  });

  test('locks the structure of a table that the role does not own', async ({
    api,
    books,
    openBooksWith,
  }) => {
    await runSqlInSchema(
      books.schema,
      `ALTER TABLE "Books"
         ADD COLUMN "Editor" integer,
         ALTER COLUMN "Title" SET DEFAULT 'Untitled'`,
    );
    await api.makeUserColumn(
      await api.getTable(books.schema, 'Books'),
      'Editor',
    );
    const tablePage = await openBooksWith('SELECT, INSERT, UPDATE, DELETE');
    const { page, sheet, inspector } = tablePage;
    const tableTab = new TableTab(page, inspector);
    const constraintsModal = new ConstraintsModal(page);
    const columnInspector = new ColumnInspector(page, inspector);
    await expect(sheet.recordRows).toHaveCount(3);
    await expect(sheet.newColumnButton).toHaveCount(0);
    await expect(tableTab.name.input).toBeDisabled();
    await expect(tableTab.description.input).toBeDisabled();
    await expect(tableTab.deleteButton).toBeDisabled();
    await tableTab.userTracking.header.click();
    await expect(tableTab.trackedColumn).toBeDisabled();

    await sheet.columnHeader('Title').click({ button: 'right' });
    await expect(menuItem(page, 'Hide Column')).toBeVisible();
    await expect(menuItem(page, 'Delete Column')).toHaveCount(0);

    await dismissContextMenu(page);
    await inspector.button('Advanced').click();
    await inspector.button(/^Constraints/).click();
    await expect(constraintsModal.body).toContainText('Primary Keys');
    await expect(constraintsModal.button('Add')).toHaveCount(0);
    await constraintsModal.close();

    await sheet.columnHeader('Title').click();
    await inspector.tab('Column').click();
    await expect(columnInspector.name.input).toBeDisabled();
    await expect(columnInspector.uniqueCheckbox).toBeDisabled();
    await expect(columnInspector.dataType.select).toBeDisabled();
    await expect(columnInspector.extractButton).toBeDisabled();
    await expect(columnInspector.deleteButton).toBeDisabled();
    const { defaultValue } = columnInspector;
    await expect(defaultValue.value).toHaveValue('Untitled');
    await expect(defaultValue.value).toBeDisabled();
    await expect(defaultValue.noDefault).toBeDisabled();
    await expect(defaultValue.customDefault).toBeDisabled();
  });

  test('lets the role that owns the table change its structure', async ({
    books,
    openBooksWith,
    collaborator: { role },
  }) => {
    await makeOwnerOfTable(books, role.name);
    const tablePage = await openBooksWith('SELECT');
    const { page, inspector } = tablePage;
    const tableTab = new TableTab(page, inspector);
    const constraintsModal = new ConstraintsModal(page);
    await expect(tablePage.sheet.newColumnButton).toBeVisible();
    await expect(tableTab.name.input).toBeEnabled();
    await expect(tableTab.deleteButton).toBeEnabled();
    await inspector.button('Advanced').click();
    await inspector.button(/^Constraints/).click();
    await expect(constraintsModal.button('Add')).toHaveCount(2);
    await constraintsModal.close();

    await tableTab.description.input.fill('Novels on the shelf');
    await tableTab.description.saveButton.click();
    await expect
      .poll(() =>
        runSqlInSchema(
          books.schema,
          `SELECT obj_description('"Books"'::regclass) AS description`,
        ),
      )
      .toEqual([{ description: 'Novels on the shelf' }]);
  });

  test('treats a table without a primary key as read-only for every role', async ({
    page,
    api,
    schema,
  }) => {
    await runSqlInSchema(
      schema,
      `CREATE TABLE "Notes" ("Text" text); INSERT INTO "Notes" VALUES ('first')`,
    );
    const tablePage = new TablePage(page);
    await tablePage.goto(await api.getTable(schema, 'Notes'));
    const cell = tablePage.sheet.cell(0, 'Text');
    await expect(cell).toHaveText('first');
    await expect(tablePage.newRecordButton).toHaveCount(0);
    await expect(tablePage.sheet.placeholderRow).toHaveCount(0);
    await expect(tablePage.inspector.button('Import')).toBeDisabled();

    await cell.click();
    await expect(cell).toHaveAttribute('data-cell-active');
    await page.keyboard.press('Enter');
    await expect(tablePage.sheet.editor).toHaveCount(0);
    await cell.click({ button: 'right' });
    await expect(menuItem(page, 'Set to NULL')).toBeDisabled();
    await expect(menuItem(page, 'Row')).toHaveCount(0);
  });
});
