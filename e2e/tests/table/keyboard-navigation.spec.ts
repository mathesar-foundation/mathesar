import { openMenu } from '../../support/ui/components/menu';
import { expect, storedBooks, test } from './books';

test.describe('moving through the sheet with the keyboard', () => {
  test('the arrow keys move the active cell one step', async ({
    page,
    tablePage: { sheet },
  }) => {
    await sheet.cell(1, 'Author').click();

    await page.keyboard.press('ArrowDown');
    await expect(sheet.activeCell).toHaveText('James Joyce');
    await page.keyboard.press('ArrowRight');
    await expect(sheet.activeCell).toHaveText('730');
    await page.keyboard.press('ArrowUp');
    await expect(sheet.activeCell).toHaveText('320');
    await page.keyboard.press('ArrowLeft');
    await expect(sheet.activeCell).toHaveText('Jane Austen');

    await expect(sheet.selectedCells).toHaveText(['Jane Austen']);
    await sheet.expectFocusOnActiveCell();
  });

  test('the arrow keys stop at the first row and the outer columns', async ({
    page,
    tablePage: { sheet },
  }) => {
    await sheet.cell(0, 'id').click();
    await page.keyboard.press('ArrowUp');
    await page.keyboard.press('ArrowLeft');
    await expect(sheet.activeCell).toHaveText('1');
    await page.keyboard.press('ArrowDown');
    await expect(sheet.activeCell).toHaveText('2');

    await sheet.cell(0, 'Notes').click();
    await page.keyboard.press('ArrowRight');
    await expect(sheet.activeCell).toHaveText('a');
    await page.keyboard.press('ArrowLeft');
    await expect(sheet.activeCell).toHaveText('D1');
  });

  test('ArrowDown moves from the last record into the empty row and stops there', async ({
    page,
    tablePage: { sheet },
  }) => {
    await sheet.cell(4, 'Title').click();
    await page.keyboard.press('ArrowDown');

    await expect(sheet.placeholderCell('Title')).toHaveAttribute(
      'data-cell-active',
    );

    await page.keyboard.press('ArrowDown');
    await expect(sheet.placeholderCell('Title')).toHaveAttribute(
      'data-cell-active',
    );
    await page.keyboard.press('ArrowUp');
    await expect(sheet.activeCell).toHaveText('Hamlet');
  });

  test('Tab moves right and Shift+Tab moves left, within the row', async ({
    page,
    tablePage: { sheet },
  }) => {
    await sheet.cell(1, 'Code').click();

    await page.keyboard.press('Tab');
    await expect(sheet.activeCell).toHaveText('b');
    await page.keyboard.press('Tab');
    await expect(sheet.activeCell).toHaveText('b');
    await sheet.expectFocusOnActiveCell();

    await page.keyboard.press('Shift+Tab');
    await expect(sheet.activeCell).toHaveText('E1');
  });

  test('Shift with an arrow key grows the selection and the opposite arrow shrinks it', async ({
    page,
    tablePage: { sheet },
  }) => {
    await sheet.cell(1, 'Author').click();
    await page.keyboard.press('Shift+ArrowDown');
    await page.keyboard.press('Shift+ArrowDown');
    await page.keyboard.press('Shift+ArrowRight');

    await expect(sheet.activeCell).toHaveText('Jane Austen');
    await expect(sheet.selectedCells).toHaveText([
      'Jane Austen',
      '320',
      'James Joyce',
      '730',
      'Toni Morrison',
      '324',
    ]);

    await page.keyboard.press('Shift+ArrowUp');
    await expect(sheet.selectedCells).toHaveText([
      'Jane Austen',
      '320',
      'James Joyce',
      '730',
    ]);
  });

  test('Shift+ArrowLeft shrinks a selection from the right, then grows it to the left up to the first column', async ({
    page,
    tablePage: { sheet },
  }) => {
    await sheet.cell(1, 'Author').click();
    await page.keyboard.press('Shift+ArrowRight');
    await expect(sheet.selectedCells).toHaveText(['Jane Austen', '320']);

    await page.keyboard.press('Shift+ArrowLeft');
    await expect(sheet.selectedCells).toHaveText(['Jane Austen']);
    await page.keyboard.press('Shift+ArrowLeft');
    await expect(sheet.selectedCells).toHaveText(['Emma', 'Jane Austen']);
    await page.keyboard.press('Shift+ArrowLeft');
    await page.keyboard.press('Shift+ArrowLeft');
    await expect(sheet.selectedCells).toHaveText(['2', 'Emma', 'Jane Austen']);
    await expect(sheet.activeCell).toHaveText('Jane Austen');
  });

  test('an arrow key alone reduces the selection to the cell next to the active one', async ({
    page,
    tablePage: { sheet },
  }) => {
    await sheet.cell(1, 'Author').click();
    await page.keyboard.press('Shift+ArrowDown');
    await page.keyboard.press('Shift+ArrowRight');
    await page.keyboard.press('ArrowLeft');

    await expect(sheet.activeCell).toHaveText('Emma');
    await expect(sheet.selectedCells).toHaveText(['Emma']);
  });

  test('typing, Delete and Backspace do not change a selected cell', async ({
    page,
    schema,
    tablePage: { sheet },
  }) => {
    await sheet.cell(1, 'Author').click();
    await page.keyboard.type('x');
    await page.keyboard.press('Delete');
    await page.keyboard.press('Backspace');

    await expect(sheet.editor).toHaveCount(0);
    await expect(sheet.cell(1, 'Author')).toHaveText('Jane Austen');
    await page.keyboard.press('ArrowDown');
    await expect(sheet.activeCell).toHaveText('James Joyce');
    expect((await storedBooks(schema))[1]?.Author).toBe('Jane Austen');
  });

  test('the keyboard works again after a context menu is closed with Escape', async ({
    page,
    tablePage: { sheet },
  }) => {
    await sheet.cell(1, 'Author').click({ button: 'right' });
    await expect(openMenu(page)).toBeVisible();
    await page.keyboard.press('Escape');

    await expect(openMenu(page)).toHaveCount(0);
    await sheet.expectFocusOnActiveCell();
    await page.keyboard.press('ArrowDown');
    await expect(sheet.activeCell).toHaveText('James Joyce');
  });
});
