import {
  type Pool,
  type PoolEntry,
  padPool,
  reconcilePool,
} from '../slotAllocator';

function entry(slot: number, rowId: string, index: number): PoolEntry {
  return { slot, key: rowId, index };
}

/** Build the live map (rowId → index) for the live argument of reconcilePool. */
function liveMap(
  rowIds: string[],
  indexByRowId?: Record<string, number>,
): Map<string, number> {
  return new Map(
    rowIds.map((id, i) => [id, indexByRowId ? indexByRowId[id] : i]),
  );
}

/**
 * Build a ghost-index lookup from a flat array of rowIds (positional indices).
 * Mirrors the consumer's full rowId→index map.
 */
function ghostLookup(
  rowIds: (string | number)[],
): (id: string | number) => number | undefined {
  const map = new Map(rowIds.map((id, i) => [id, i]));
  return (id) => map.get(id);
}

const NO_GHOST_LOOKUP: (id: string | number) => undefined = () => undefined;

describe('reconcilePool', () => {
  test('initial fill from empty pool allocates fresh slots 0..N-1', () => {
    const result = reconcilePool(
      [],
      liveMap(['a', 'b', 'c']),
      NO_GHOST_LOOKUP,
      60,
    );
    expect(result.map((e) => e.slot).sort((x, y) => x - y)).toEqual([0, 1, 2]);
    const byId = new Map(result.map((e) => [e.key, e]));
    expect(byId.get('a')?.index).toBe(0);
    expect(byId.get('c')?.index).toBe(2);
  });

  test('rows still in liveItems keep their slot integer (DOM recycled)', () => {
    const prev: Pool = [entry(0, 'a', 0), entry(1, 'b', 1), entry(2, 'c', 2)];
    const result = reconcilePool(
      prev,
      liveMap(['a', 'b', 'c']),
      NO_GHOST_LOOKUP,
      60,
    );
    const byId = new Map(result.map((e) => [e.key, e.slot]));
    expect(byId.get('a')).toBe(0);
    expect(byId.get('b')).toBe(1);
    expect(byId.get('c')).toBe(2);
  });

  test('row that scrolls out becomes a ghost (slot retained)', () => {
    const prev: Pool = [entry(0, 'a', 0), entry(1, 'b', 1), entry(2, 'c', 2)];
    const result = reconcilePool(
      prev,
      liveMap(['a', 'b']),
      ghostLookup(['a', 'b', 'c']),
      60,
    );
    expect(result.find((e) => e.key === 'c')?.slot).toBe(2);
    expect(result).toHaveLength(3);
  });

  test('a new live row claims a ghost slot (no fresh allocation)', () => {
    const prev: Pool = [entry(0, 'a', 0), entry(2, 'b', 1)]; // b is ghost
    const result = reconcilePool(
      prev,
      liveMap(['a', 'c'], { a: 0, c: 2 }),
      ghostLookup(['a', 'b', 'c']),
      60,
    );
    const c = result.find((e) => e.key === 'c');
    expect(c).toBeDefined();
    // 'c' should have taken b's old slot integer (2), not allocated a fresh one
    expect(c?.slot).toBe(2);
    // 'b' should be gone (its slot got reclaimed)
    expect(result.find((e) => e.key === 'b')).toBeUndefined();
  });

  test('row with vanished rowId is dropped; its slot integer becomes available', () => {
    const prev: Pool = [
      entry(0, 'a', 0),
      entry(1, 'gone', 1),
      entry(2, 'c', 2),
    ];
    // 'gone' is no longer live and ghost lookup returns undefined for it
    const result = reconcilePool(
      prev,
      liveMap(['a', 'c'], { a: 0, c: 1 }),
      ghostLookup(['a', 'c']),
      60,
    );
    expect(result.find((e) => e.key === 'gone')).toBeUndefined();
    expect(result.find((e) => e.key === 'a')?.slot).toBe(0);
    expect(result.find((e) => e.key === 'c')?.slot).toBe(2);
  });

  test('cap eviction removes oldest ghosts when pool would exceed cap', () => {
    const prev: Pool = [
      entry(0, 'g1', 0),
      entry(1, 'g2', 1),
      entry(2, 'g3', 2),
      entry(3, 'g4', 3),
    ];
    // none live; all become ghosts. cap=2 → keep 2 newest ghosts.
    const result = reconcilePool(
      [...prev],
      liveMap([]),
      ghostLookup(['g1', 'g2', 'g3', 'g4']),
      2,
    );
    expect(result).toHaveLength(2);
    // FIFO eviction on insertion order — first ones evicted first
    expect(result.find((e) => e.key === 'g1')).toBeUndefined();
    expect(result.find((e) => e.key === 'g2')).toBeUndefined();
    expect(result.find((e) => e.key === 'g3')).toBeDefined();
    expect(result.find((e) => e.key === 'g4')).toBeDefined();
  });

  test('all rowIds churn (e.g. after refresh) — slot integers reused for new live rows', () => {
    // prev pool had 5 entries with rowIds A1..A5
    const prev: Pool = [
      entry(0, 'A1', 0),
      entry(1, 'A2', 1),
      entry(2, 'A3', 2),
      entry(3, 'A4', 3),
      entry(4, 'A5', 4),
    ];
    // refresh: all new identifiers; only 3 are now live; no ghost lookup
    // resolves the old ids (they're gone).
    const result = reconcilePool(
      prev,
      liveMap(['B1', 'B2', 'B3']),
      NO_GHOST_LOOKUP,
      60,
    );
    // The 5 old entries are dropped. New 3 live rows allocate slot integers
    // from 0 (since usedSlots is empty post-drop).
    expect(result).toHaveLength(3);
    const slots = result.map((e) => e.slot).sort((x, y) => x - y);
    expect(slots).toEqual([0, 1, 2]);
  });

  test('live items get slotted even when no ghost lookup is available', () => {
    // Regression: ExplorationResults path. With NO_GHOST_LOOKUP, live items
    // should still be slotted (they don't need a callback — their indices
    // come from liveItems).
    const result = reconcilePool(
      [],
      liveMap(['a', 'b', 'c']),
      NO_GHOST_LOOKUP,
      60,
    );
    expect(result).toHaveLength(3);
    expect(result.map((e) => e.key).sort()).toEqual(['a', 'b', 'c']);
  });
});

describe('padPool', () => {
  type FakeRow = { identifier: string; recyclable: boolean };
  function makeRows(rowIds: string[], recyclable = true): FakeRow[] {
    return rowIds.map((id) => ({ identifier: id, recyclable }));
  }
  function pad(
    pool: Pool,
    target: number,
    liveStart: number,
    liveEnd: number,
    rows: FakeRow[],
  ): Pool {
    return padPool(
      pool,
      target,
      liveStart,
      liveEnd,
      rows.length,
      (i) => rows[i].identifier,
      (i) => rows[i].recyclable,
    );
  }

  test('no-op when pool already meets target', () => {
    const pool: Pool = [entry(0, 'a', 0), entry(1, 'b', 1)];
    const result = pad(pool, 2, 0, 1, makeRows(['a', 'b', 'c']));
    expect(result).toEqual(pool);
  });

  test('top boundary: pads with rows below the live range', () => {
    const pool: Pool = [entry(0, 'a', 0), entry(1, 'b', 1), entry(2, 'c', 2)];
    const rows = makeRows(['a', 'b', 'c', 'd', 'e', 'f', 'g']);
    const result = pad(pool, 5, 0, 2, rows);
    expect(result).toHaveLength(5);
    const padded = result.slice(3);
    expect(padded.map((e) => e.key).sort()).toEqual(['d', 'e']);
    expect(padded[0].slot).not.toBe(0);
    expect(padded[0].slot).not.toBe(1);
    expect(padded[0].slot).not.toBe(2);
  });

  test('bottom boundary: pads with rows above the live range', () => {
    const pool: Pool = [entry(0, 'e', 4), entry(1, 'f', 5), entry(2, 'g', 6)];
    const rows = makeRows(['a', 'b', 'c', 'd', 'e', 'f', 'g']);
    const result = pad(pool, 5, 4, 6, rows);
    expect(result).toHaveLength(5);
    const padded = result.slice(3);
    expect(padded.map((e) => e.key).sort()).toEqual(['c', 'd']);
  });

  test('mid-data: pads alternately from both sides', () => {
    const pool: Pool = [entry(0, 'd', 3), entry(1, 'e', 4), entry(2, 'f', 5)];
    const rows = makeRows(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']);
    const result = pad(pool, 5, 3, 5, rows);
    expect(result).toHaveLength(5);
    const padded = result.slice(3);
    expect(padded.map((e) => e.key).sort()).toEqual(['c', 'g']);
  });

  test('skips non-recyclable rows (e.g. placeholder / group header)', () => {
    const pool: Pool = [entry(0, 'a', 0)];
    const rows: FakeRow[] = [
      { identifier: 'a', recyclable: true },
      { identifier: 'group1', recyclable: false },
      { identifier: 'b', recyclable: true },
      { identifier: 'placeholder', recyclable: false },
      { identifier: 'c', recyclable: true },
    ];
    const result = pad(pool, 3, 0, 0, rows);
    expect(result).toHaveLength(3);
    const padded = result.slice(1);
    expect(padded.map((e) => e.key)).toEqual(['b', 'c']);
  });

  test('skips rowIds already in the pool (no duplicates)', () => {
    const pool: Pool = [entry(0, 'a', 0), entry(5, 'c', 2)];
    const rows = makeRows(['a', 'b', 'c', 'd']);
    const result = pad(pool, 4, 0, 0, rows);
    expect(result).toHaveLength(4);
    const padded = result.slice(2);
    expect(padded.map((e) => e.key).sort()).toEqual(['b', 'd']);
  });

  test('runs out of candidates gracefully (small dataset)', () => {
    const pool: Pool = [entry(0, 'a', 0), entry(1, 'b', 1)];
    const rows = makeRows(['a', 'b']);
    const result = pad(pool, 5, 0, 1, rows);
    expect(result).toHaveLength(2);
  });

  test('assigns smallest unused slot integers', () => {
    const pool: Pool = [entry(0, 'a', 0), entry(2, 'b', 1)];
    const rows = makeRows(['a', 'b', 'c', 'd']);
    const result = pad(pool, 4, 0, 1, rows);
    expect(result).toHaveLength(4);
    const padded = result.slice(2);
    const paddedSlots = padded.map((e) => e.slot).sort((x, y) => x - y);
    expect(paddedSlots).toEqual([1, 3]);
  });

  test('empty pool with empty rows is a no-op', () => {
    const result = pad([], 5, 0, -1, []);
    expect(result).toEqual([]);
  });

  test('targetSize of 0 returns pool unchanged', () => {
    const pool: Pool = [entry(0, 'a', 0)];
    const result = pad(pool, 0, 0, 0, makeRows(['a', 'b']));
    expect(result).toEqual(pool);
  });
});
