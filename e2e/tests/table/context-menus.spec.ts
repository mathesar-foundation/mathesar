import {
  dismissContextMenu,
  menuItem,
  openMenu,
} from '../../support/ui/components/menu';
import { expect, test } from './books';

test.describe('the context menu of the sheet', () => {
  test('on one cell offers copy, paste, NULL and the row and column submenus', async ({
    page,
    tablePage: { sheet },
  }) => {
    await sheet.cell(1, 'Author').click({ button: 'right' });

    await expect(openMenu(page).getByRole('menuitem')).toHaveText([
      'Copy',
      'Paste',
      'Set to NULL',
      'Row',
      'Column',
    ]);
  });

  test('on several cells names the number of cells, rows and columns', async ({
    page,
    tablePage: { sheet },
  }) => {
    await sheet.cell(0, 'Author').click();
    await sheet.cell(1, 'Pages').click({ modifiers: ['Shift'] });
    await sheet.cell(1, 'Pages').click({ button: 'right' });

    await expect(openMenu(page).getByRole('menuitem')).toHaveText([
      'Copy',
      'Paste',
      'Set 4 cells to NULL',
      'Rows',
      'Columns',
    ]);
  });

  test('the Row submenu holds the record actions', async ({
    page,
    books,
    tablePage: { sheet },
  }) => {
    await sheet.cell(1, 'Author').click({ button: 'right' });
    await menuItem(page, 'Row').hover();
    const submenu = openMenu(page).last();

    await expect(submenu.getByRole('menuitem')).toHaveText([
      'Quick View Record',
      'Duplicate Record',
      'Delete Record',
    ]);
    await expect(
      submenu.getByRole('link', { name: 'Open Record' }),
    ).toHaveAttribute('href', new RegExp(`/tables/${books.oid}/2$`));
  });

  test('the Column submenu holds the column actions', async ({
    page,
    tablePage: { sheet },
  }) => {
    await sheet.cell(1, 'Author').click({ button: 'right' });
    await menuItem(page, 'Column').hover();

    await expect(openMenu(page).last().getByRole('menuitem')).toHaveText([
      'Filter Column',
      'Sort A-Z',
      'Sort Z-A',
      'Group by Column',
      'Hide Column',
      'Delete Column',
    ]);
  });

  test('on a row number holds the record actions', async ({
    page,
    tablePage: { sheet },
  }) => {
    await sheet.rowHeader(2).click({ button: 'right' });

    await expect(openMenu(page).getByRole('menuitem')).toHaveText([
      'Quick View Record',
      'Duplicate Record',
      'Delete Record',
    ]);
    await expect(sheet.selectedCells).toHaveCount(6);
  });

  test('on a column header holds the column actions, named for the data type', async ({
    page,
    tablePage: { sheet },
  }) => {
    await sheet.columnHeader('Pages').click({ button: 'right' });

    await expect(openMenu(page).getByRole('menuitem')).toHaveText([
      'Filter Column',
      'Sort 0-9',
      'Sort 9-0',
      'Group by Column',
      'Hide Column',
      'Delete Column',
    ]);
  });

  test('on several selected column headers only offers to hide them', async ({
    page,
    tablePage: { sheet },
  }) => {
    await sheet.columnHeader('Author').click();
    await sheet.columnHeader('Pages').click({ modifiers: ['Shift'] });
    await sheet.columnHeader('Author').click({ button: 'right' });

    await expect(openMenu(page).getByRole('menuitem')).toHaveText([
      'Hide 2 columns',
    ]);
  });

  test('stays open after a click on a submenu entry, and Escape closes one level at a time', async ({
    page,
    tablePage: { sheet },
  }) => {
    await sheet.cell(1, 'Author').click({ button: 'right' });
    await menuItem(page, 'Row').click();
    await expect(menuItem(page, 'Quick View Record')).toBeVisible();
    await menuItem(page, 'Column').hover();
    await expect(menuItem(page, 'Filter Column')).toBeVisible();
    await expect(openMenu(page)).toHaveCount(2);

    await page.keyboard.press('Escape');
    await expect(openMenu(page)).toHaveCount(1);
    await expect(menuItem(page, 'Column')).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(openMenu(page)).toHaveCount(0);
  });

  test('the arrow keys move through the open menu and leave the active cell where it is', async ({
    page,
    tablePage: { sheet },
  }) => {
    await sheet.cell(1, 'Author').click({ button: 'right' });
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');

    await expect(menuItem(page, 'Paste')).toBeFocused();
    await expect(sheet.activeCell).toHaveText('Jane Austen');
  });

  test('ArrowRight opens the submenu of the focused entry, the next ArrowDown moves into it, and ArrowLeft closes it', async ({
    page,
    tablePage: { sheet },
  }) => {
    await sheet.cell(1, 'Author').click({ button: 'right' });
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await expect(menuItem(page, 'Row')).toBeFocused();

    await page.keyboard.press('ArrowRight');
    await expect(openMenu(page).last().getByRole('menuitem')).toHaveText([
      'Quick View Record',
      'Duplicate Record',
      'Delete Record',
    ]);
    await page.keyboard.press('ArrowDown');
    await expect(menuItem(page, 'Quick View Record')).toBeFocused();

    await page.keyboard.press('ArrowLeft');
    await expect(openMenu(page)).toHaveCount(1);
    await expect(menuItem(page, 'Row')).toBeFocused();
  });

  test('does not open on the record link of a primary key cell', async ({
    page,
    tablePage,
  }) => {
    await tablePage.sheet.recordLink(1).click({ button: 'right' });

    await expect(openMenu(page)).toHaveCount(0);
    await tablePage.recordModal.expectClosed();
  });

  test('does not open on the empty last row', async ({
    page,
    tablePage: { sheet },
  }) => {
    await sheet.placeholderCell('Author').click({ button: 'right' });

    await expect(openMenu(page)).toHaveCount(0);
  });

  test('closes on a click elsewhere and gives the focus back to the cell', async ({
    page,
    tablePage: { sheet },
  }) => {
    await sheet.cell(1, 'Author').click({ button: 'right' });
    await expect(openMenu(page)).toBeVisible();
    await dismissContextMenu(page);

    await expect(openMenu(page)).toHaveCount(0);
    await expect(sheet.activeCell).toHaveText('Jane Austen');
    await sheet.expectFocusOnActiveCell();
  });

  test('a right-click on another cell while the menu is open only closes the menu', async ({
    page,
    tablePage: { sheet },
  }) => {
    await sheet.cell(1, 'Author').click({ button: 'right' });
    await expect(openMenu(page)).toBeVisible();
    await sheet.rightClickAt(sheet.cell(3, 'Code'));

    await expect(openMenu(page)).toHaveCount(0);
    await expect(sheet.selectedCells).toHaveText(['Jane Austen']);
    await sheet.expectFocusOnActiveCell();
  });

  test('Quick View Record opens the record of the row in a modal', async ({
    page,
    tablePage,
  }) => {
    await tablePage.sheet.rowHeader(2).click({ button: 'right' });
    await menuItem(page, 'Quick View Record').click();

    await tablePage.recordModal.expectOpen();
    await expect(tablePage.recordModalField('Title')).toHaveValue('Ulysses');
  });
});

test.describe('Select Cell Range on a touch screen', () => {
  test.use({ hasTouch: true });

  test.beforeEach(async ({ tablePage: { sheet } }) => {
    // A tap tells the app that the device has a touch screen.
    await sheet.cell(1, 'Author').tap();
    await sheet.cell(1, 'Author').click({ button: 'right' });
  });

  test('is offered in the menu of a cell', async ({ page }) => {
    await expect(openMenu(page).getByRole('menuitem')).toHaveText([
      'Copy',
      'Paste',
      'Set to NULL',
      'Select Cell Range',
      'Row',
      'Column',
    ]);
  });

  test('marks the active cell until the next tap selects the cells from it to the tapped cell', async ({
    page,
    tablePage: { sheet },
  }) => {
    await menuItem(page, 'Select Cell Range').tap();
    await expect(sheet.cellRangeIndicator()).toBeVisible();
    await sheet.cell(3, 'Code').tap();

    await expect(sheet.activeCell).toHaveText('Jane Austen');
    await expect(sheet.selectedCells).toHaveText([
      'Jane Austen',
      '320',
      'E1',
      'James Joyce',
      '730',
      'U1',
      'Toni Morrison',
      '324',
      'B1',
    ]);
    await expect(sheet.cellRangeIndicator()).toHaveCount(0);
  });

  test('then a tap on a row number selects the rows from the active cell to that row', async ({
    page,
    tablePage: { sheet },
  }) => {
    await menuItem(page, 'Select Cell Range').tap();
    await sheet.rowHeader(3).tap();

    await expect(sheet.activeCell).toHaveText('2');
    await expect(sheet.selectedCells).toHaveCount(18);
    await expect(sheet.selectedCells.last()).toHaveText('d');
  });

  test('then a tap on a column header selects the columns from the active cell to that column', async ({
    page,
    tablePage: { sheet },
  }) => {
    await menuItem(page, 'Select Cell Range').tap();
    await sheet.columnHeader('Code').tap();

    await expect(sheet.activeCell).toHaveText('Frank Herbert');
    await expect(sheet.selectedCells).toHaveCount(15);
    await expect(sheet.selectedCells.nth(2)).toHaveText('D1');
  });
});
