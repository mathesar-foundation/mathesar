import { runSqlInSchema } from '../../support/api/mathesar';
import { holdRpcCalls } from '../../support/held-requests';
import { pinsKnownBug } from '../../support/known-bugs';
import { TablePage } from '../../support/ui/pages/table-page';
import { tableUrl } from '../../support/ui/urls';
import { expect, test } from './books';
import { answerColumnsAfterRecords } from './load-order';

test.describe('selecting cells with the mouse', () => {
  test('the first cell is active when the table opens', async ({
    tablePage: { sheet },
  }) => {
    await expect(sheet.activeCell).toHaveText('1');
    await expect(sheet.selectedCells).toHaveText(['1']);
  });

  test('a click makes one cell active and selected', async ({
    tablePage: { sheet },
  }) => {
    await sheet.cell(1, 'Author').click();

    await expect(sheet.activeCell).toHaveText('Jane Austen');
    await expect(sheet.selectedCells).toHaveText(['Jane Austen']);
    await sheet.expectFocusOnActiveCell();
  });

  test('a shift-click selects the rectangle from the active cell', async ({
    tablePage: { sheet },
  }) => {
    await sheet.cell(1, 'Author').click();
    await sheet.cell(3, 'Pages').click({ modifiers: ['Shift'] });

    await expect(sheet.activeCell).toHaveText('Jane Austen');
    await expect(sheet.selectedCells).toHaveText([
      'Jane Austen',
      '320',
      'James Joyce',
      '730',
      'Toni Morrison',
      '324',
    ]);
  });

  test('a control-click leaves the selection as it is', async ({
    tablePage: { sheet },
  }) => {
    await sheet.cell(1, 'Author').click();
    await sheet.cell(3, 'Pages').click({ modifiers: ['Control'] });

    await expect(sheet.selectedCells).toHaveText(['Jane Austen']);
  });

  test('a drag selects the rectangle it spans, while the button is still down', async ({
    page,
    tablePage: { sheet },
  }) => {
    await sheet.cell(0, 'Title').hover();
    await page.mouse.down();
    await sheet.cell(1, 'Author').hover();

    await expect(sheet.selectedCells).toHaveText([
      'Dune',
      'Frank Herbert',
      'Emma',
      'Jane Austen',
    ]);

    await sheet.cell(2, 'Pages').hover();
    await page.mouse.up();

    await expect(sheet.activeCell).toHaveText('Dune');
    await expect(sheet.selectedCells).toHaveCount(9);
    await expect(sheet.selectedCells.last()).toHaveText('730');
  });

  test('a drag back towards the start shrinks the selection', async ({
    page,
    tablePage: { sheet },
  }) => {
    await sheet.cell(0, 'Title').hover();
    await page.mouse.down();
    await sheet.cell(2, 'Pages').hover();
    await sheet.cell(0, 'Author').hover();
    await page.mouse.up();

    await expect(sheet.selectedCells).toHaveText(['Dune', 'Frank Herbert']);
  });

  test('a drag into the empty last row stops at the last record', async ({
    tablePage: { sheet },
  }) => {
    await sheet.dragBetween(
      sheet.cell(3, 'Title'),
      sheet.placeholderCell('Title'),
    );

    await expect(sheet.selectedCells).toHaveText(['Beloved', 'Hamlet']);
  });

  test('a drag that starts in the empty last row selects only the cell where it started', async ({
    tablePage: { sheet },
  }) => {
    await sheet.dragBetween(
      sheet.placeholderCell('Title'),
      sheet.cell(1, 'Author'),
    );

    await expect(sheet.placeholderCell('Title')).toHaveAttribute(
      'data-cell-selected',
    );
    await expect(sheet.selectedCells).toHaveCount(1);
  });

  test('a click on a column header selects the column', async ({
    tablePage: { sheet },
  }) => {
    await sheet.columnHeader('Author').click();

    await expect(sheet.activeCell).toHaveText('Frank Herbert');
    await expect(sheet.selectedCells).toHaveText([
      'Frank Herbert',
      'Jane Austen',
      'James Joyce',
      'Toni Morrison',
      'NULL',
    ]);
  });

  test('a shift-click on a column header extends to that column', async ({
    tablePage: { sheet },
  }) => {
    await sheet.columnHeader('Author').click();
    await sheet.columnHeader('Code').click({ modifiers: ['Shift'] });

    await expect(sheet.activeCell).toHaveText('Frank Herbert');
    await expect(sheet.selectedCells).toHaveCount(15);
    await expect(sheet.selectedCells.first()).toHaveText('Frank Herbert');
    await expect(sheet.selectedCells.nth(2)).toHaveText('D1');
  });

  test('a drag across column headers selects those columns', async ({
    tablePage: { sheet },
  }) => {
    await sheet.dragBetween(
      sheet.columnHeader('Title'),
      sheet.columnHeader('Pages'),
    );

    await expect(sheet.activeCell).toHaveText('Dune');
    await expect(sheet.selectedCells).toHaveCount(15);
    await expect(sheet.selectedCells.nth(2)).toHaveText('412');
  });

  test('a click on a row number selects the row', async ({
    tablePage: { sheet },
  }) => {
    await sheet.rowHeader(1).click();

    await expect(sheet.activeCell).toHaveText('2');
    await expect(sheet.selectedCells).toHaveText([
      '2',
      'Emma',
      'Jane Austen',
      '320',
      'E1',
      'b',
    ]);
  });

  test('a drag across row numbers selects those rows', async ({
    tablePage: { sheet },
  }) => {
    await sheet.dragBetween(sheet.rowHeader(0), sheet.rowHeader(2));

    await expect(sheet.activeCell).toHaveText('1');
    await expect(sheet.selectedCells).toHaveCount(18);
    await expect(sheet.selectedCells.last()).toHaveText('NULL');
  });

  test(
    'a shift-click on a row number selects only the first column of the rows in between',
    pinsKnownBug('sheet-shift-click-row-number'),
    async ({ tablePage: { sheet } }) => {
      await sheet.rowHeader(1).click();
      await sheet.rowHeader(3).click({ modifiers: ['Shift'] });

      await expect(sheet.selectedCells).toHaveText(['2', '3', '4']);
    },
  );

  test.fixme('a shift-click on a row number extends to that row', async ({
    tablePage: { sheet },
  }) => {
    await sheet.rowHeader(1).click();
    await sheet.rowHeader(3).click({ modifiers: ['Shift'] });

    await expect(sheet.activeCell).toHaveText('2');
    await expect(sheet.selectedCells).toHaveCount(18);
    await expect(sheet.selectedCells.last()).toHaveText('d');
  });

  test('a click on the corner cell keeps the selection', async ({
    tablePage: { sheet },
  }) => {
    await sheet.columnHeader('Author').click();
    await sheet.originCell.click();

    await expect(sheet.selectedCells).toHaveCount(5);
  });

  test('the frame of the active cell is stronger while the cell has the focus', async ({
    tablePage: { sheet },
  }) => {
    await sheet.cell(1, 'Author').click();
    await expect(sheet.activeCellIndicator()).toHaveCSS(
      'border-top-width',
      '3px',
    );

    await sheet.originCell.click();
    await expect(sheet.focusTarget(sheet.activeCell)).not.toBeFocused();
    await expect(sheet.activeCellIndicator()).toHaveCSS(
      'border-top-width',
      '2px',
    );
  });

  test('a right-click on a cell outside the selection selects that cell', async ({
    tablePage: { sheet },
  }) => {
    await sheet.cell(0, 'Title').click();
    await sheet.cell(4, 'Notes').click({ button: 'right' });

    await expect(sheet.activeCell).toHaveText('e');
    await expect(sheet.selectedCells).toHaveText(['e']);
  });

  test('a right-click inside the selection keeps it', async ({
    tablePage: { sheet },
  }) => {
    await sheet.cell(0, 'Title').click();
    await sheet.cell(1, 'Author').click({ modifiers: ['Shift'] });
    await sheet.cell(1, 'Title').click({ button: 'right' });

    await expect(sheet.selectedCells).toHaveText([
      'Dune',
      'Frank Herbert',
      'Emma',
      'Jane Austen',
    ]);
  });

  test('the selection stays on the same cells after a refresh', async ({
    schema,
    tablePage,
  }) => {
    const { sheet } = tablePage;
    await sheet.cell(1, 'Author').click();
    await sheet.cell(2, 'Pages').click({ modifiers: ['Shift'] });
    await runSqlInSchema(
      schema,
      `UPDATE "Books" SET "Pages" = 731 WHERE "Title" = 'Ulysses'`,
    );
    await tablePage.refreshButton.click();

    await expect(sheet.selectedCells).toHaveText([
      'Jane Austen',
      '320',
      'James Joyce',
      '731',
    ]);
    await expect(sheet.activeCell).toHaveText('Jane Austen');
  });
});

// The records are shown while the constraints of the table still load.
test.describe('a cell clicked while the table still loads', () => {
  test(
    'gives up its selection to the first cell when loading ends',
    pinsKnownBug('sheet-selection-while-loading'),
    async ({ page, books }) => {
      const tablePage = new TablePage(page);
      const { sheet } = tablePage;
      const finishLoading = await holdRpcCalls(page, 'constraints.list');
      await page.goto(tableUrl(books));
      await sheet.cell(1, 'Author').click();
      await expect(sheet.activeCell).toHaveText('Jane Austen');

      finishLoading();
      await tablePage.expectLoaded();
      await expect(sheet.activeCell).toHaveText('1');
      await expect(sheet.selectedCells).toHaveText(['1']);
    },
  );

  test.fixme('stays selected when loading ends', async ({ page, books }) => {
    const tablePage = new TablePage(page);
    const { sheet } = tablePage;
    const finishLoading = await holdRpcCalls(page, 'constraints.list');
    await page.goto(tableUrl(books));
    await sheet.cell(1, 'Author').click();
    await expect(sheet.activeCell).toHaveText('Jane Austen');

    finishLoading();
    await tablePage.expectLoaded();
    await expect(sheet.activeCell).toHaveText('Jane Austen');
    await expect(sheet.selectedCells).toHaveText(['Jane Austen']);
  });
});

// The order of the answers differs between loads. Most loads get the columns first.
test.describe('the first cell of a table whose columns arrive after its records', () => {
  let tablePage: TablePage;

  test.beforeEach(async ({ page, books }) => {
    tablePage = new TablePage(page);
    const answerRecordsAgain = await answerColumnsAfterRecords(page);
    await page.goto(tableUrl(books));
    // The second answer of the records replaces rows that are on the page.
    await expect(tablePage.sheet.row(0)).toBeVisible();
    answerRecordsAgain();
    await tablePage.expectLoaded();
  });

  test(
    'is active without the keyboard focus, so the arrow keys do nothing',
    pinsKnownBug('sheet-initial-focus'),
    async ({ page }) => {
      const { sheet } = tablePage;
      await expect(sheet.activeCell).toHaveText('1');

      await expect(sheet.focusTarget(sheet.activeCell)).not.toBeFocused();
      await page.keyboard.press('ArrowDown');
      await expect(sheet.activeCell).toHaveText('1');
    },
  );

  test.fixme('has the keyboard focus', async ({ page }) => {
    const { sheet } = tablePage;
    await expect(sheet.activeCell).toHaveText('1');

    await sheet.expectFocusOnActiveCell();
    await page.keyboard.press('ArrowDown');
    await expect(sheet.activeCell).toHaveText('2');
  });
});
