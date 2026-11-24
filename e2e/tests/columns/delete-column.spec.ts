import { menuItem } from '../../support/ui/components/menu';
import { Toasts } from '../../support/ui/components/toast';
import { viewStateInUrl } from '../../support/ui/table-view-url';
import { expect, storedColumns, test } from './fixtures';

const BOOKS_COLUMNS = ['id', 'Title', 'Author', 'Pages', 'Code', 'Notes'];

test.describe('deleting a column', () => {
  test('the menu of a column header deletes the column after confirmation', async ({
    page,
    books,
    tablePage: { sheet },
    columnInspector: { deleteModal },
  }) => {
    await sheet.columnHeader('Pages').click({ button: 'right' });
    await menuItem(page, 'Delete Column').click();

    await expect(deleteModal.title).toHaveText('Delete Column Pages?');
    await expect(deleteModal.body).toHaveText(
      /All objects related to this column will be affected\.\s*This could break existing tables and views\.\s*Are you sure you want to proceed\?/,
    );
    await deleteModal.button('Delete Column').click();

    await deleteModal.expectClosed();
    await expect(sheet.columnHeaders).toHaveText([
      'id',
      'Title',
      'Author',
      'Code',
      'Notes',
    ]);
    await expect(sheet.cell(0, 'Code')).toHaveText('D1');
    expect(
      (await storedColumns(books.schema, 'Books')).map(({ name }) => name),
    ).toEqual(['id', 'Title', 'Author', 'Code', 'Notes']);
  });

  test('cancelling the confirmation keeps the column', async ({
    page,
    books,
    tablePage: { sheet },
    columnInspector: { deleteModal },
  }) => {
    await sheet.columnHeader('Pages').click({ button: 'right' });
    await menuItem(page, 'Delete Column').click();
    await expect(deleteModal.button('Cancel')).toBeFocused();
    await deleteModal.button('Cancel').click();

    await deleteModal.expectClosed();
    await expect(sheet.columnHeaders).toHaveText(BOOKS_COLUMNS);
    expect(
      (await storedColumns(books.schema, 'Books')).map(({ name }) => name),
    ).toEqual(BOOKS_COLUMNS);
  });

  test('the inspector deletes the selected column, then shows the column that took its place', async ({
    books,
    tablePage: { sheet },
    columnInspector,
  }) => {
    await sheet.columnHeader('Pages').click();
    await columnInspector.deleteButton.click();
    await expect(columnInspector.deleteModal.title).toHaveText(
      'Delete Column Pages?',
    );
    await columnInspector.deleteModal.button('Delete Column').click();

    await columnInspector.deleteModal.expectClosed();
    await expect(sheet.columnHeader('Pages')).toHaveCount(0);
    await expect(columnInspector.name.input).toHaveValue('Code');
    expect(
      (await storedColumns(books.schema, 'Books')).map(({ name }) => name),
    ).not.toContain('Pages');
  });

  test('deleting a sorted column also drops its sort', async ({
    page,
    tablePage: { sheet },
    columnInspector: { deleteModal },
  }) => {
    await sheet.columnHeader('Author').click({ button: 'right' });
    await menuItem(page, 'Sort A-Z').click();
    await expect(sheet.cell(sheet.recordRows, 'Title')).toHaveText([
      'Dune',
      'Ulysses',
      'Emma',
      'Beloved',
      'Hamlet',
    ]);

    await sheet.columnHeader('Author').click({ button: 'right' });
    await menuItem(page, 'Delete Column').click();
    await deleteModal.button('Delete Column').click();

    await expect(sheet.cell(sheet.recordRows, 'Title')).toHaveText([
      'Dune',
      'Emma',
      'Ulysses',
      'Beloved',
      'Hamlet',
    ]);
    expect(viewStateInUrl(page)).toBeUndefined();
  });

  test.describe('used by a view', () => {
    test.use({ extraSql: 'CREATE VIEW "Codes" AS SELECT "Code" FROM "Books"' });

    test('is refused with the error of the database, and the column stays', async ({
      page,
      books,
      tablePage: { sheet },
      columnInspector: { deleteModal },
    }) => {
      await sheet.columnHeader('Code').click({ button: 'right' });
      await menuItem(page, 'Delete Column').click();
      await deleteModal.button('Delete Column').click();

      await new Toasts(page).expectMessage(
        'Unable to delete Column. DependentObjectsStillExist: cannot drop column Code of table',
      );
      await deleteModal.expectClosed();
      await expect(sheet.columnHeaders).toHaveText(BOOKS_COLUMNS);
      expect(
        (await storedColumns(books.schema, 'Books')).map(({ name }) => name),
      ).toEqual(BOOKS_COLUMNS);
    });
  });
});
