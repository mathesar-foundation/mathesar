import { type Props, getItemsInfo } from '../listUtils';

/**
 * Build a Props object with a fixed-height item list. Item metadata is
 * pre-populated so getRangeToRender / getItemsInfo doesn't need to walk it.
 */
function makeProps<Row>(opts: {
  rows: Row[];
  scrollOffset: number;
  height: number;
  overscanCount: number;
  rowSize?: number;
}): Props<Row> {
  const rowSize = opts.rowSize ?? 30;
  const itemMetadataMap: Record<number, { offset: number; size: number }> = {};
  for (let i = 0; i < opts.rows.length; i += 1) {
    itemMetadataMap[i] = { offset: i * rowSize, size: rowSize };
  }
  return {
    rowSize: () => rowSize,
    rowKey: (_row: Row, index: number) => String(index),
    instanceProps: {
      lastMeasuredIndex: opts.rows.length - 1,
      itemMetadataMap,
      styleCache: {},
    },
    rows: opts.rows,
    overscanCount: opts.overscanCount,
    scrollOffset: opts.scrollOffset,
    height: opts.height,
    estimatedItemSize: rowSize,
  };
}

describe('getItemsInfo / getRangeToRender (rebalanced overscan)', () => {
  test('mid-data: full overscan on both sides', () => {
    // viewport height 300px / row 30px = 10 visible rows starting around row 50
    const info = getItemsInfo(
      makeProps({
        rows: new Array(200).fill(0),
        scrollOffset: 50 * 30, // start at row 50
        height: 300,
        overscanCount: 6,
      }),
    );
    // visible rows: 50..59 (10 rows). overscan 6 each side → render 44..65.
    expect(info.startIndex).toBe(44);
    expect(info.stopIndex).toBe(65);
    expect(info.items).toHaveLength(22); // 10 visible + 12 overscan
    expect(info.items[0].index).toBe(44);
    expect(info.items[info.items.length - 1].index).toBe(65);
  });

  test('top boundary at scrollOffset=0: above-overscan deficit shifts to below', () => {
    const info = getItemsInfo(
      makeProps({
        rows: new Array(200).fill(0),
        scrollOffset: 0,
        height: 300,
        overscanCount: 6,
      }),
    );
    // visible 0..9. above unavailable (startIndex=0) → 6 deficit. below gets
    // 6 + 6 = 12. Render 0..21. Total 22 rows.
    expect(info.startIndex).toBe(0);
    expect(info.stopIndex).toBe(21);
    expect(info.items).toHaveLength(22);
  });

  test('top boundary while scrolling: items.length stays stable', () => {
    // Same height/overscan; vary scrollOffset within the boundary-clamped zone.
    // Currently (before fix), items.length grows as scrollOffset grows. After
    // fix, items.length is constant.
    const lengths = [0, 30, 60, 90, 120, 150, 180].map((scrollOffset) => {
      const info = getItemsInfo(
        makeProps({
          rows: new Array(200).fill(0),
          scrollOffset,
          height: 300,
          overscanCount: 6,
        }),
      );
      return info.items.length;
    });
    // All scrollOffsets within the boundary zone should produce the same
    // rendered window size.
    expect(new Set(lengths).size).toBe(1);
    expect(lengths[0]).toBe(22); // visible (10) + 2*overscan (12)
  });

  test('bottom boundary: below-overscan deficit shifts to above', () => {
    // 200 items; scroll to the very bottom. visible 190..199.
    const info = getItemsInfo(
      makeProps({
        rows: new Array(200).fill(0),
        scrollOffset: 190 * 30,
        height: 300,
        overscanCount: 6,
      }),
    );
    // below unavailable (stopIndex=199) → 6 deficit. above gets 6 + 6 = 12.
    // Render 178..199. Total 22 rows.
    expect(info.startIndex).toBe(178);
    expect(info.stopIndex).toBe(199);
    expect(info.items).toHaveLength(22);
  });

  test('dataset smaller than rendered window: clamped to itemCount', () => {
    // Only 8 items; viewport could fit 10 + 12 overscan = 22 rows, but we
    // only have 8.
    const info = getItemsInfo(
      makeProps({
        rows: new Array(8).fill(0),
        scrollOffset: 0,
        height: 300,
        overscanCount: 6,
      }),
    );
    expect(info.startIndex).toBe(0);
    expect(info.stopIndex).toBe(7);
    expect(info.items).toHaveLength(8);
  });

  test('itemCount = 0: returns empty items', () => {
    const info = getItemsInfo(
      makeProps({
        rows: new Array(0),
        scrollOffset: 0,
        height: 300,
        overscanCount: 6,
      }),
    );
    expect(info.items).toHaveLength(0);
  });

  test('lifting off top boundary: rendered range shifts but size stays constant', () => {
    // scrollOffset that puts startIndex past overscan — fully mid-data.
    const info = getItemsInfo(
      makeProps({
        rows: new Array(200).fill(0),
        scrollOffset: 10 * 30, // startIndex = 10 (past overscan=6)
        height: 300,
        overscanCount: 6,
      }),
    );
    // visible 10..19. above gets full 6. below gets full 6. Render 4..25.
    expect(info.startIndex).toBe(4);
    expect(info.stopIndex).toBe(25);
    expect(info.items).toHaveLength(22);
  });
});
