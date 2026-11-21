import { menuItem } from '../../support/ui/components/menu';
import { Toasts } from '../../support/ui/components/toast';
import { ORDER_COLUMNS, expect, test } from './fixtures';

test.describe('hiding columns', () => {
  test('a checked column is hidden and comes back in its place when unchecked', async ({
    ordersPage: { sheet },
    hide,
  }) => {
    await hide.trigger.click();
    await expect(hide.checkboxes).toHaveCount(ORDER_COLUMNS.length);
    await expect(hide.checkbox('Note')).not.toBeChecked();

    await hide.checkbox('Note').check();
    await expect(sheet.columnHeaders).toHaveText(
      ORDER_COLUMNS.filter((column) => column !== 'Note'),
    );
    await expect(hide.trigger).toHaveText('Hide 1');

    await hide.checkbox('Note').uncheck();
    await expect(sheet.columnHeaders).toHaveText(ORDER_COLUMNS);
    await expect(hide.trigger).toHaveText('Hide');
  });

  test('Hide all hides every column and Show all shows them again', async ({
    ordersPage: { sheet },
    hide,
  }) => {
    await hide.trigger.click();
    await hide.hideAllButton.click();
    await expect(sheet.columnHeaders).toHaveCount(0);
    await expect(sheet.recordRows).toHaveCount(6);
    await expect(hide.trigger).toHaveText(`Hide ${ORDER_COLUMNS.length}`);

    await hide.showAllButton.click();
    await expect(sheet.columnHeaders).toHaveText(ORDER_COLUMNS);
    await expect(hide.trigger).toHaveText('Hide');
  });

  test('Hide Column in the header menu hides that column', async ({
    page,
    ordersPage: { sheet },
    hide,
  }) => {
    await sheet.columnHeader('Quantity').click({ button: 'right' });
    await menuItem(page, 'Hide Column').click();

    await expect(sheet.columnHeader('Quantity')).toHaveCount(0);
    await expect(hide.trigger).toHaveText('Hide 1');
    await hide.trigger.click();
    await expect(hide.checkbox('Quantity')).toBeChecked();
  });

  test('the header menu of several selected columns hides them all', async ({
    page,
    ordersPage: { sheet },
    hide,
  }) => {
    await sheet.columnHeader('Note').click();
    await sheet.columnHeader('Paid').click({ modifiers: ['Shift'] });
    await sheet.columnHeader('Note').click({ button: 'right' });
    await menuItem(page, 'Hide 3 columns').click();

    await expect(sheet.columnHeaders).toHaveText(
      ORDER_COLUMNS.filter(
        (column) => !['Note', 'Quantity', 'Paid'].includes(column),
      ),
    );
    await expect(hide.trigger).toHaveText('Hide 3');
  });

  test('New Record shows a hidden column that the record needs', async ({
    page,
    ordersPage,
    hide,
  }) => {
    const { sheet } = ordersPage;
    await hide.trigger.click();
    await hide.checkbox('Item').check();
    await hide.checkbox('Note').check();
    await expect(sheet.columnHeader('Item')).toHaveCount(0);
    await ordersPage.heading.click();

    await ordersPage.newRecordButton.click();

    await new Toasts(page).expectMessage(
      'Required hidden columns were made visible.',
    );
    await expect(sheet.columnHeader('Item')).toBeVisible();
    await expect(sheet.columnHeader('Note')).toHaveCount(0);
    await expect(hide.trigger).toHaveText('Hide 1');
  });
});
