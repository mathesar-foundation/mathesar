import { recordRpcCalls } from '../../support/rpc-log';
import { expect, test } from './books';

const DEFAULT_COLUMN_WIDTH = 160;

async function widthOf(locator: {
  boundingBox(): Promise<{ width: number } | null>;
}): Promise<number | undefined> {
  return (await locator.boundingBox())?.width;
}

test.describe('resizing columns', () => {
  test('dragging the edge of a header resizes header and cells, and the width survives a reload', async ({
    page,
    api,
    books,
    tablePage,
  }) => {
    const { sheet } = tablePage;
    await sheet.dragColumnEdge('Title', 60);

    await expect
      .poll(() => widthOf(sheet.columnHeader('Title')))
      .toBe(DEFAULT_COLUMN_WIDTH + 60);
    expect(await widthOf(sheet.cell(0, 'Title'))).toBe(
      DEFAULT_COLUMN_WIDTH + 60,
    );
    await expect(sheet.selectedCells).toHaveText(['1']);
    await expect
      .poll(() => api.columnMetadata(books, 'Title'))
      .toEqual({ display_width: DEFAULT_COLUMN_WIDTH + 60 });

    await page.reload();
    await tablePage.expectLoaded();
    expect(await widthOf(sheet.columnHeader('Title'))).toBe(
      DEFAULT_COLUMN_WIDTH + 60,
    );
  });

  test('dragging the edge of one selected column resizes all selected columns', async ({
    tablePage: { sheet },
  }) => {
    await sheet.columnHeader('Author').click();
    await sheet.columnHeader('Pages').click({ modifiers: ['Shift'] });
    await sheet.dragColumnEdge('Pages', 40);

    await expect
      .poll(() => widthOf(sheet.columnHeader('Pages')))
      .toBe(DEFAULT_COLUMN_WIDTH + 40);
    expect(await widthOf(sheet.columnHeader('Author'))).toBe(
      DEFAULT_COLUMN_WIDTH + 40,
    );
    expect(await widthOf(sheet.columnHeader('Title'))).toBe(
      DEFAULT_COLUMN_WIDTH,
    );
  });

  test('a double click on the edge resets the width', async ({
    api,
    books,
    tablePage: { sheet },
  }) => {
    await sheet.dragColumnEdge('Title', 60);
    // A reset sent while the new width is still being stored can lose the race.
    await expect
      .poll(() => api.columnMetadata(books, 'Title'))
      .toEqual({ display_width: DEFAULT_COLUMN_WIDTH + 60 });

    await sheet.resizeHandle('Title').dblclick({ position: { x: 3, y: 10 } });

    await expect
      .poll(() => widthOf(sheet.columnHeader('Title')))
      .toBe(DEFAULT_COLUMN_WIDTH);
    expect(await api.columnMetadata(books, 'Title')).toEqual({});
  });

  test('a drag far past the narrowest and the widest width stops at 20 and 1000 pixels, also after a reload', async ({
    page,
    api,
    books,
    tablePage,
  }) => {
    const { sheet } = tablePage;
    await sheet.dragColumnEdge('Title', -300);
    await sheet.dragColumnEdge('Author', 900);

    await expect.poll(() => widthOf(sheet.columnHeader('Title'))).toBe(20);
    await expect.poll(() => widthOf(sheet.columnHeader('Author'))).toBe(1000);
    await expect
      .poll(() => api.columnMetadata(books, 'Title'))
      .toEqual({ display_width: 20 });
    await expect
      .poll(() => api.columnMetadata(books, 'Author'))
      .toEqual({ display_width: 1000 });

    await page.reload();
    await tablePage.expectLoaded();
    expect(await widthOf(sheet.columnHeader('Title'))).toBe(20);
    expect(await widthOf(sheet.columnHeader('Author'))).toBe(1000);
  });
});

test.describe('reordering columns', () => {
  test('a selected column is dragged by its header to a new place, which survives a reload', async ({
    page,
    api,
    books,
    tablePage,
  }) => {
    const { sheet } = tablePage;
    await sheet.columnHeader('Pages').click();
    await sheet.dragColumnHeader('Pages', 'Title');

    const reordered = ['id', 'Pages', 'Title', 'Author', 'Code', 'Notes'];
    await expect(sheet.columnHeaders).toHaveText(reordered);
    await expect(sheet.cell(0, 'Pages')).toHaveText('412');
    await expect
      .poll(() => api.columnOrder(books))
      .toEqual(reordered.map((name) => books.columns[name]));

    await page.reload();
    await tablePage.expectLoaded();
    await expect(sheet.columnHeaders).toHaveText(reordered);
  });

  test('a selected column dropped on the corner cell moves to the front, also after a reload', async ({
    page,
    api,
    books,
    tablePage,
  }) => {
    const { sheet } = tablePage;
    await sheet.columnHeader('Pages').click();
    await sheet.dragColumnHeaderToCorner('Pages');

    const reordered = ['Pages', 'id', 'Title', 'Author', 'Code', 'Notes'];
    await expect(sheet.columnHeaders).toHaveText(reordered);
    await expect(sheet.cell(0, 'Pages')).toHaveText('412');
    await expect
      .poll(() => api.columnOrder(books))
      .toEqual(reordered.map((name) => books.columns[name]));

    await page.reload();
    await tablePage.expectLoaded();
    await expect(sheet.columnHeaders).toHaveText(reordered);
  });

  test('a drag of a header whose column is not selected selects columns instead', async ({
    tablePage: { sheet },
  }) => {
    await sheet.dragBetween(
      sheet.columnHeader('Pages'),
      sheet.columnHeader('Title'),
    );

    await expect(sheet.columnHeaders).toHaveText([
      'id',
      'Title',
      'Author',
      'Pages',
      'Code',
      'Notes',
    ]);
    await expect(sheet.selectedCells).toHaveCount(15);
  });
});

test.describe('requests of the table page', () => {
  test('a column resize stores the width once', async ({
    page,
    tablePage: { sheet },
  }) => {
    const rpcCalls = recordRpcCalls(page);
    await sheet.dragColumnEdge('Title', 60);

    await expect
      .poll(() => rpcCalls.filter((method) => method.endsWith('.set')))
      .toEqual(['columns.metadata.set']);
  });
});
