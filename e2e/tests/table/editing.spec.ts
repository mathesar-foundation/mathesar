import { holdRpcCalls } from '../../support/held-requests';
import { recordRpcCalls } from '../../support/rpc-log';
import { pauseClock } from '../../support/ui/clock';
import { menuItem } from '../../support/ui/components/menu';
import { Modal } from '../../support/ui/components/modal';
import { expect, storedBooks, test } from './books';

test.describe('editing a cell', () => {
  test('Enter opens the editor with the current value and Enter saves the new one', async ({
    page,
    schema,
    tablePage: { sheet },
  }) => {
    await sheet.cell(1, 'Author').click();
    await page.keyboard.press('Enter');
    await expect(sheet.editor).toBeFocused();
    await expect(sheet.editor).toHaveValue('Jane Austen');

    await sheet.editor.fill('J. Austen');
    await page.keyboard.press('Enter');

    await expect(sheet.editor).toHaveCount(0);
    await expect(sheet.cell(1, 'Author')).toHaveText('J. Austen');
    await expect(sheet.activeCell).toHaveText('J. Austen');
    await sheet.expectFocusOnActiveCell();
    await expect
      .poll(async () => (await storedBooks(schema))[1]?.Author)
      .toBe('J. Austen');
  });

  test('a double click opens the editor', async ({ tablePage: { sheet } }) => {
    await sheet.cell(2, 'Title').dblclick();

    await expect(sheet.editor).toBeFocused();
    await expect(sheet.editor).toHaveValue('Ulysses');
  });

  test('a click inside the open editor keeps it open', async ({
    page,
    tablePage: { sheet },
  }) => {
    await sheet.cell(2, 'Title').dblclick();
    await sheet.editor.click({ position: { x: 20, y: 10 } });
    await page.keyboard.press('End');
    await page.keyboard.type('!');

    await expect(sheet.editor).toBeFocused();
    await expect(sheet.editor).toHaveValue('Ulysses!');
    await expect(sheet.selectedCells).toHaveCount(1);
  });

  test('Escape closes the editor and discards what was typed', async ({
    page,
    schema,
    tablePage: { sheet },
  }) => {
    const rpcCalls = recordRpcCalls(page);
    await sheet.cell(1, 'Author').click();
    await page.keyboard.press('Enter');
    await sheet.editor.fill('discarded');
    await page.keyboard.press('Escape');

    await expect(sheet.editor).toHaveCount(0);
    await expect(sheet.cell(1, 'Author')).toHaveText('Jane Austen');
    await sheet.expectFocusOnActiveCell();
    expect(rpcCalls).not.toContain('records.patch');
    expect((await storedBooks(schema))[1]?.Author).toBe('Jane Austen');
  });

  test('closing the editor without a change sends no update', async ({
    page,
    tablePage: { sheet },
  }) => {
    const rpcCalls = recordRpcCalls(page);
    await sheet.cell(1, 'Author').click();
    await page.keyboard.press('Enter');
    await page.keyboard.press('Enter');
    await expect(sheet.editor).toHaveCount(0);

    await sheet.editCell(sheet.cell(2, 'Author'), 'J. Joyce');
    await expect.poll(() => rpcCalls).toEqual(['records.patch']);
  });

  test('a click on another cell saves the edit once and selects that cell', async ({
    page,
    schema,
    tablePage: { sheet },
  }) => {
    await sheet.cell(1, 'Author').click();
    await page.keyboard.press('Enter');
    await sheet.editor.fill('J. Austen');
    const rpcCalls = recordRpcCalls(page);
    await sheet.cell(3, 'Pages').click();

    await expect(sheet.editor).toHaveCount(0);
    await expect(sheet.cell(1, 'Author')).toHaveText('J. Austen');
    await expect(sheet.activeCell).toHaveText('324');
    await sheet.expectFocusOnActiveCell();
    await expect
      .poll(async () => (await storedBooks(schema))[1]?.Author)
      .toBe('J. Austen');
    expect(rpcCalls).toEqual(['records.patch']);
  });

  test('a click outside the sheet saves the edit and leaves the focus there', async ({
    page,
    schema,
    tablePage: { sheet, inspector },
  }) => {
    await sheet.cell(1, 'Author').click();
    await page.keyboard.press('Enter');
    await sheet.editor.fill('J. Austen');
    await inspector.tab('Column').click();

    await expect(sheet.editor).toHaveCount(0);
    await expect(sheet.cell(1, 'Author')).toHaveText('J. Austen');
    await expect(inspector.tab('Column')).toBeFocused();
    await expect
      .poll(async () => (await storedBooks(schema))[1]?.Author)
      .toBe('J. Austen');
  });

  test('Tab saves the edit once and moves to the next cell', async ({
    page,
    schema,
    tablePage: { sheet },
  }) => {
    await sheet.cell(1, 'Author').click();
    await page.keyboard.press('Enter');
    await sheet.editor.fill('J. Austen');
    const rpcCalls = recordRpcCalls(page);
    await page.keyboard.press('Tab');

    await expect(sheet.editor).toHaveCount(0);
    await expect(sheet.activeCell).toHaveText('320');
    await sheet.expectFocusOnActiveCell();
    await expect
      .poll(async () => (await storedBooks(schema))[1]?.Author)
      .toBe('J. Austen');
    expect(rpcCalls).toEqual(['records.patch']);
  });

  test('the arrow keys move the text cursor while the editor is open', async ({
    page,
    tablePage: { sheet },
  }) => {
    await sheet.cell(1, 'Author').click();
    await page.keyboard.press('Enter');
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.type('!');

    await expect(sheet.editor).toBeFocused();
    await expect(sheet.editor).toHaveValue('Jane Auste!n');
    await expect(sheet.cell(1, 'Author')).toHaveAttribute('data-cell-active');
  });

  test('Shift+Enter adds a line break to a text cell', async ({
    page,
    schema,
    tablePage: { sheet },
  }) => {
    await sheet.cell(1, 'Author').click();
    await page.keyboard.press('Enter');
    await page.keyboard.press('End');
    await page.keyboard.press('Shift+Enter');
    await page.keyboard.type('and others');
    await expect(sheet.editor).toBeFocused();
    await page.keyboard.press('Enter');

    await expect(sheet.cell(1, 'Author')).toHaveText('Jane Austen and others');
    await expect
      .poll(async () => (await storedBooks(schema))[1]?.Author)
      .toBe('Jane Austen\nand others');
  });

  test('an emptied text cell stores an empty string, not NULL', async ({
    schema,
    tablePage: { sheet },
  }) => {
    await sheet.editCell(sheet.cell(1, 'Author'), '');

    await expect(sheet.cell(1, 'Author')).toHaveText('');
    await expect
      .poll(async () => (await storedBooks(schema))[1]?.Author)
      .toBe('');
  });

  test('the primary key cell does not open an editor', async ({
    page,
    tablePage: { sheet },
  }) => {
    await sheet.cell(1, 'id').click();
    await page.keyboard.press('Enter');

    await expect(sheet.editor).toHaveCount(0);
    await expect(sheet.cell(1, 'id')).toHaveAttribute('data-cell-active');
    await page.keyboard.press('ArrowDown');
    await expect(sheet.activeCell).toHaveText('3');
  });
});

test.describe('a value that the database rejects', () => {
  test('stays in the cell with an error and is not stored', async ({
    schema,
    tablePage: { sheet },
  }) => {
    const code = sheet.cell(1, 'Code');
    await sheet.editCell(code, 'D1');

    await expect(sheet.errorIndicator(code)).toBeVisible();
    await expect(code).toHaveText('D1');
    await expect(sheet.cellErrors).toContainText(
      'duplicate key value violates unique constraint "Books_Code_key"',
    );
    expect((await storedBooks(schema))[1]?.Code).toBe('E1');
  });

  test('is replaced and saved by the next valid edit', async ({
    schema,
    tablePage,
  }) => {
    const { sheet } = tablePage;
    const code = sheet.cell(1, 'Code');
    await sheet.editCell(code, 'D1');
    await expect(sheet.errorIndicator(code)).toBeVisible();

    await sheet.editCell(code, 'E2');

    // The mark also hides while the edit is being saved.
    await expect(tablePage.saveStatus()).toHaveText('All Changes Saved');
    await expect(sheet.errorIndicator(code)).toHaveCount(0);
    await expect(code).toHaveText('E2');
    await expect
      .poll(async () => (await storedBooks(schema))[1]?.Code)
      .toBe('E2');
  });

  test('shows its message while the cell is active or under the pointer', async ({
    tablePage: { sheet },
  }) => {
    const code = sheet.cell(1, 'Code');
    await sheet.editCell(code, 'D1');
    await expect(sheet.cellErrors).toContainText('Key ("Code")=(D1)');

    await sheet.cell(0, 'Title').click();
    await expect(sheet.cellErrors).toHaveCount(0);
    await code.hover();
    await expect(sheet.cellErrors).toContainText('Key ("Code")=(D1)');
    await sheet.cell(0, 'Title').hover();
    await expect(sheet.cellErrors).toHaveCount(0);
  });

  test('does not block edits of other records', async ({
    schema,
    tablePage: { sheet },
  }) => {
    await sheet.editCell(sheet.cell(1, 'Code'), 'D1');
    await expect(sheet.errorIndicator(sheet.cell(1, 'Code'))).toBeVisible();

    await sheet.editCell(sheet.cell(2, 'Author'), 'J. Joyce');

    await expect
      .poll(async () => (await storedBooks(schema))[2]?.Author)
      .toBe('J. Joyce');
    await expect(sheet.errorIndicator(sheet.cell(1, 'Code'))).toBeVisible();
  });

  test('marks the row number until the value is corrected, with a message on hover', async ({
    tablePage,
  }) => {
    const { sheet } = tablePage;
    await sheet.editCell(sheet.cell(1, 'Code'), 'D1');
    await expect(sheet.errorIndicator(sheet.rowHeader(1))).toBeVisible();
    await expect(sheet.errorIndicator(sheet.rowHeader(0))).toHaveCount(0);

    await sheet.cell(0, 'Title').click();
    await sheet.rowHeader(1).hover();
    await expect(sheet.cellErrors).toHaveText([
      'This row contains a cell with an error.',
    ]);

    await sheet.editCell(sheet.cell(1, 'Code'), 'E2');
    // The mark is also gone while the value is being saved.
    await expect(tablePage.saveStatus()).toHaveText('All Changes Saved');
    await expect(sheet.errorIndicator(sheet.rowHeader(1))).toHaveCount(0);
  });
});

test.describe('the save status in the page header', () => {
  test('says "Saving Changes" while an edit is saved, then "All Changes Saved" for five seconds', async ({
    page,
    schema,
    tablePage,
  }) => {
    const { sheet } = tablePage;
    await page.clock.install();
    const releasePatch = await holdRpcCalls(page, 'records.patch');
    await sheet.editCell(sheet.cell(1, 'Author'), 'J. Austen');
    await expect(tablePage.saveStatus()).toHaveText('Saving Changes');

    await pauseClock(page);
    releasePatch();
    await expect(tablePage.saveStatus()).toHaveText('All Changes Saved');
    await page.clock.runFor(4500);
    await expect(tablePage.saveStatus()).toHaveText('All Changes Saved');
    // After five seconds the status fades out for one second.
    await page.clock.runFor(2000);
    await expect(tablePage.saveStatus()).toHaveCount(0);
    await expect
      .poll(async () => (await storedBooks(schema))[1]?.Author)
      .toBe('J. Austen');
  });

  test('shows no status once the database has refused the value', async ({
    page,
    tablePage,
  }) => {
    const { sheet } = tablePage;
    const releasePatch = await holdRpcCalls(page, 'records.patch');
    await sheet.editCell(sheet.cell(1, 'Code'), 'D1');
    await expect(tablePage.saveStatus()).toHaveText('Saving Changes');
    releasePatch();

    await expect(sheet.errorIndicator(sheet.cell(1, 'Code'))).toBeVisible();
    await expect(tablePage.saveStatus()).toHaveCount(0);
  });
});

test.describe('setting cells to NULL from the context menu', () => {
  test('clears one cell at once', async ({
    page,
    schema,
    tablePage: { sheet },
  }) => {
    await sheet.cell(1, 'Author').click({ button: 'right' });
    await menuItem(page, 'Set to NULL').click();

    await expect(sheet.cell(1, 'Author')).toHaveText('NULL');
    await expect
      .poll(async () => (await storedBooks(schema))[1]?.Author)
      .toBeNull();
  });

  test('asks before it clears several cells', async ({
    page,
    schema,
    tablePage: { sheet },
  }) => {
    await sheet.cell(0, 'Author').click();
    await sheet.cell(1, 'Pages').click({ modifiers: ['Shift'] });
    await sheet.cell(1, 'Pages').click({ button: 'right' });
    await menuItem(page, 'Set 4 cells to NULL').click();

    const confirmation = new Modal(page, 'Set 4 cells to NULL');
    await confirmation.expectOpen();
    expect((await storedBooks(schema))[0]?.Author).toBe('Frank Herbert');

    await confirmation.button('Yes').click();
    await confirmation.expectClosed();
    await expect(sheet.selectedCells).toHaveText([
      'NULL',
      'NULL',
      'NULL',
      'NULL',
    ]);
    await expect
      .poll(async () =>
        (await storedBooks(schema))
          .slice(0, 2)
          .map(({ Author, Pages }) => [Author, Pages]),
      )
      .toEqual([
        [null, null],
        [null, null],
      ]);
  });

  test('is disabled for a column that disallows NULL', async ({
    page,
    tablePage: { sheet },
  }) => {
    await sheet.cell(1, 'Title').click({ button: 'right' });

    await expect(menuItem(page, 'Set to NULL')).toBeDisabled();
  });

  test('is disabled for a cell that is NULL already', async ({
    page,
    tablePage: { sheet },
  }) => {
    await sheet.cell(4, 'Author').click({ button: 'right' });

    await expect(menuItem(page, 'Set to NULL')).toBeDisabled();
  });
});
