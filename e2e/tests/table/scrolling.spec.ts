import { runSqlInSchema } from '../../support/api/mathesar';
import { pinsKnownBug } from '../../support/known-bugs';
import { TablePage } from '../../support/ui/pages/table-page';
import { expect, test } from './large-tables';
import { answerRecordsLast } from './load-order';

test.describe('a table with more records than fit on the screen', () => {
  let tablePage: TablePage;

  test.beforeEach(async ({ page, longTable }) => {
    tablePage = new TablePage(page);
    await tablePage.goto(longTable);
  });

  test('renders only the records near the viewport', async () => {
    const { sheet } = tablePage;
    await expect(tablePage.recordCount).toHaveText('Showing 1–500 of 1,200');
    await expect(sheet.rowContaining('row 1')).toBeInViewport();
    await expect(sheet.rowContaining('row 20')).toBeInViewport();
    await expect(sheet.rowContaining('row 100')).toHaveCount(0);
  });

  test('renders more records in a taller window and fewer in a shorter one', async ({
    page,
  }) => {
    const { sheet } = tablePage;
    await expect(sheet.rowContaining('row 28')).toHaveCount(1);
    await expect(sheet.rowContaining('row 30')).toHaveCount(0);

    await page.setViewportSize({ width: 1440, height: 1200 });
    await expect(sheet.rowContaining('row 30')).toBeInViewport();

    await page.setViewportSize({ width: 1440, height: 500 });
    await expect(sheet.rowContaining('row 20')).toHaveCount(0);
    await expect(sheet.rowContaining('row 5')).toBeInViewport();
  });

  test('the sheet takes the width that the hidden inspector frees', async () => {
    const { sheet } = tablePage;
    const widthWithInspector = (await sheet.scroller.boundingBox())?.width ?? 0;
    await tablePage.inspectorToggle.click();

    await expect
      .poll(async () => (await sheet.scroller.boundingBox())?.width)
      .toBeGreaterThan(widthWithInspector + 300);
  });

  test('scrolling with the wheel brings later records in and drops earlier ones', async ({
    page,
  }) => {
    const { sheet } = tablePage;
    await sheet.cell(0, 'Label').hover();
    await page.mouse.wheel(0, 3000);

    await expect(sheet.rowContaining('row 110')).toBeInViewport();
    await expect(
      sheet.cell(sheet.rowContaining('row 110'), 'Number'),
    ).toHaveText('110');
    await expect(sheet.rowHeader(sheet.rowContaining('row 110'))).toHaveText(
      '110',
    );
    await expect(sheet.rowContaining('row 1')).toHaveCount(0);

    await page.mouse.wheel(0, -3000);
    await expect(sheet.rowContaining('row 1')).toBeInViewport();
    await expect(sheet.rowContaining('row 110')).toHaveCount(0);
  });

  test('the end of the page shows the last record of the page and the empty row', async ({
    page,
  }) => {
    const { sheet } = tablePage;
    await sheet.cell(0, 'Label').hover();
    await page.mouse.wheel(0, 20000);

    await expect(sheet.rowContaining('row 500')).toBeInViewport();
    await expect(sheet.placeholderRow).toBeInViewport();
    await expect(sheet.rowContaining('row 501')).toHaveCount(0);
  });

  test('a selection is still there after scrolling away and back', async ({
    page,
  }) => {
    const { sheet } = tablePage;
    await sheet.cell(2, 'Label').click();
    await sheet.cell(3, 'Number').click({ modifiers: ['Shift'] });
    await page.mouse.wheel(0, 3000);
    await expect(sheet.selectedCells).toHaveCount(0);

    await page.mouse.wheel(0, -3000);
    await expect(sheet.activeCell).toHaveText('row 3');
    await expect(sheet.selectedCells).toHaveText(['row 3', '3', 'row 4', '4']);
  });

  test('a record that was scrolled to can be edited', async ({
    page,
    schema,
  }) => {
    const { sheet } = tablePage;
    await sheet.cell(0, 'Label').hover();
    await page.mouse.wheel(0, 3000);
    await sheet.editCell(
      sheet.cell(sheet.rowContaining('row 110'), 'Label'),
      'edited after scrolling',
    );

    await expect(sheet.rowContaining('edited after scrolling')).toBeVisible();
    await expect
      .poll(() =>
        runSqlInSchema(schema, `SELECT "Label" FROM "Long" WHERE id = 110`),
      )
      .toEqual([{ Label: 'edited after scrolling' }]);
  });

  test('ArrowDown moves the active cell without scrolling, until the cell nears the lower edge', async ({
    page,
  }) => {
    const { sheet } = tablePage;
    await sheet.cell(0, 'Label').click();
    for (let row = 2; row <= 21; row += 1) {
      await page.keyboard.press('ArrowDown');
      await expect(sheet.activeCell).toHaveText(`row ${row}`);
    }
    expect(await sheet.scrollTop()).toBe(0);

    await page.keyboard.press('ArrowDown');
    await expect(sheet.activeCell).toHaveText('row 22');
    await expect.poll(() => sheet.scrollTop()).toBeGreaterThan(0);
    await expect(sheet.activeCell).toBeInViewport({ ratio: 1 });
  });

  test('New Record scrolls down to the new record and makes its first cell active', async () => {
    const { sheet } = tablePage;
    await tablePage.newRecordButton.click();

    const newRecord = sheet.rowContaining('1201');
    await expect(newRecord).toBeInViewport();
    await expect(sheet.cell(newRecord, 'Label')).toHaveAttribute(
      'data-cell-active',
    );
    await sheet.expectFocusOnActiveCell();
  });
});

test.describe('a table with more columns than fit on the screen', () => {
  let tablePage: TablePage;

  test.beforeEach(async ({ page, wideTable }) => {
    tablePage = new TablePage(page);
    await tablePage.goto(wideTable);
  });

  test('ArrowRight scrolls the active cell into view and keeps the focus', async ({
    page,
  }) => {
    const { sheet } = tablePage;
    await expect(sheet.columnHeader('C25')).not.toBeInViewport();
    await sheet.cell(0, 'C1').click();
    for (let press = 0; press < 24; press += 1) {
      await page.keyboard.press('ArrowRight');
    }

    await expect(sheet.activeCell).toHaveText('r1c25');
    await expect(sheet.activeCell).toBeInViewport();
    await sheet.expectFocusOnActiveCell();
    await expect(sheet.columnHeader('C1')).not.toBeInViewport();
  });

  test('the column headers scroll with their columns and the row numbers stay in place', async ({
    page,
  }) => {
    const { sheet } = tablePage;
    const rowNumberBefore = await sheet.rowHeader(0).boundingBox();
    await sheet.cell(0, 'C1').hover();
    await page.mouse.wheel(2500, 0);

    await expect(sheet.columnHeader('C20')).toBeInViewport();
    const header = await sheet.columnHeader('C20').boundingBox();
    const cell = await sheet.cell(0, 'C20').boundingBox();
    expect(header?.x).toBe(cell?.x);
    expect(header?.width).toBe(cell?.width);
    expect(await sheet.rowHeader(0).boundingBox()).toEqual(rowNumberBefore);
  });
});

// The order of the answers differs between loads. Most loads get the records last.
test.describe('a long table whose records arrive after its columns and constraints', () => {
  let tablePage: TablePage;

  test.beforeEach(async ({ page, longTable }) => {
    await answerRecordsLast(page);
    tablePage = new TablePage(page);
    await tablePage.goto(longTable);
  });

  test(
    'loses the keyboard focus shortly after ArrowDown first scrolls the sheet, which stops the arrow keys',
    pinsKnownBug('sheet-keyboard-navigation-stops-on-scroll'),
    async ({ page }) => {
      const { sheet } = tablePage;
      await sheet.cell(0, 'Label').click();
      for (let row = 2; row <= 22; row += 1) {
        await page.keyboard.press('ArrowDown');
        await expect(sheet.activeCell).toHaveText(`row ${row}`);
      }

      await expect(sheet.focusTarget(sheet.activeCell)).not.toBeFocused();
      await page.keyboard.press('ArrowDown');
      await expect(sheet.activeCell).toHaveText('row 22');
    },
  );

  test.fixme('ArrowDown keeps moving the active cell and scrolls it into view', async ({
    page,
  }) => {
    const { sheet } = tablePage;
    await sheet.cell(0, 'Label').click();
    for (let press = 0; press < 40; press += 1) {
      await page.keyboard.press('ArrowDown');
    }

    await expect(sheet.activeCell).toHaveText('row 41');
    await expect(sheet.activeCell).toBeInViewport();
    await sheet.expectFocusOnActiveCell();
  });
});
