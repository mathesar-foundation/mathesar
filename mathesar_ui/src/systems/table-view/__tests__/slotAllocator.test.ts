import {
  type Pool,
  type PoolEntry,
  padPool,
  reconcilePool,
} from '../slotAllocator';

function entry(slot: number, rowId: string, index: number): PoolEntry {
  return { slot, rowId, index };
}

function indexMap(rowIds: string[]): Map<string, number> {
  return new Map(rowIds.map((id, i) => [id, i]));
}

function liveSet(...ids: string[]): Set<string> {
  return new Set(ids);
}

describe('reconcilePool', () => {
  test('initial fill from empty pool allocates fresh slots 0..N-1', () => {
    const result = reconcilePool(
      [],
      liveSet('a', 'b', 'c'),
      indexMap(['a', 'b', 'c']),
      60,
    );
    expect(result.map((e) => e.slot).sort((x, y) => x - y)).toEqual([0, 1, 2]);
    const byId = new Map(result.map((e) => [e.rowId, e]));
    expect(byId.get('a')?.index).toBe(0);
    expect(byId.get('c')?.index).toBe(2);
  });

  test('rows still in liveRowIds keep their slot integer (DOM recycled)', () => {
    const prev: Pool = [entry(0, 'a', 0), entry(1, 'b', 1), entry(2, 'c', 2)];
    const result = reconcilePool(
      prev,
      liveSet('a', 'b', 'c'),
      indexMap(['a', 'b', 'c']),
      60,
    );
    const byId = new Map(result.map((e) => [e.rowId, e.slot]));
    expect(byId.get('a')).toBe(0);
    expect(byId.get('b')).toBe(1);
    expect(byId.get('c')).toBe(2);
  });

  test('row that scrolls out becomes a ghost (slot retained)', () => {
    const prev: Pool = [entry(0, 'a', 0), entry(1, 'b', 1), entry(2, 'c', 2)];
    const result = reconcilePool(
      prev,
      liveSet('a', 'b'),
      indexMap(['a', 'b', 'c']),
      60,
    );
    // 'c' should still be present as a ghost
    expect(result.find((e) => e.rowId === 'c')?.slot).toBe(2);
    expect(result).toHaveLength(3);
  });

  test('a new live row claims a ghost slot (no fresh allocation)', () => {
    const prev: Pool = [entry(0, 'a', 0), entry(2, 'b', 1)]; // b is ghost
    const result = reconcilePool(
      prev,
      liveSet('a', 'c'),
      indexMap(['a', 'b', 'c']),
      60,
    );
    const c = result.find((e) => e.rowId === 'c');
    expect(c).toBeDefined();
    // 'c' should have taken b's old slot integer (2), not allocated a fresh one
    expect(c?.slot).toBe(2);
    // 'b' should be gone (its slot got reclaimed)
    expect(result.find((e) => e.rowId === 'b')).toBeUndefined();
  });

  test('row with vanished rowId is dropped; its slot integer becomes available', () => {
    const prev: Pool = [
      entry(0, 'a', 0),
      entry(1, 'gone', 1),
      entry(2, 'c', 2),
    ];
    // 'gone' is no longer in descriptors
    const result = reconcilePool(
      prev,
      liveSet('a', 'c'),
      indexMap(['a', 'c']),
      60,
    );
    expect(result.find((e) => e.rowId === 'gone')).toBeUndefined();
    expect(result.find((e) => e.rowId === 'a')?.slot).toBe(0);
    expect(result.find((e) => e.rowId === 'c')?.slot).toBe(2);
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
      liveSet(),
      indexMap(['g1', 'g2', 'g3', 'g4']),
      2,
    );
    expect(result).toHaveLength(2);
    // FIFO eviction on insertion order — first ones evicted first
    expect(result.find((e) => e.rowId === 'g1')).toBeUndefined();
    expect(result.find((e) => e.rowId === 'g2')).toBeUndefined();
    expect(result.find((e) => e.rowId === 'g3')).toBeDefined();
    expect(result.find((e) => e.rowId === 'g4')).toBeDefined();
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
    // refresh: all new identifiers; only 3 are now live
    const result = reconcilePool(
      prev,
      liveSet('B1', 'B2', 'B3'),
      indexMap(['B1', 'B2', 'B3']),
      60,
    );
    // The 5 old entries are dropped (rowIds vanished). New 3 live rows
    // allocate slot integers from 0 (since usedSlots is empty post-drop).
    expect(result).toHaveLength(3);
    const slots = result.map((e) => e.slot).sort((x, y) => x - y);
    expect(slots).toEqual([0, 1, 2]);
  });
});

describe('padPool', () => {
  // Helper: descriptors are plain { identifier, eligible } objects so the
  // generic test doesn't depend on the real Row classes.
  type FakeRow = { identifier: string; eligible: boolean };
  function makeDescriptors(
    rowIds: string[],
    eligibleByDefault = true,
  ): FakeRow[] {
    return rowIds.map((id) => ({
      identifier: id,
      eligible: eligibleByDefault,
    }));
  }
  function pad(
    pool: Pool,
    target: number,
    liveStart: number,
    liveEnd: number,
    descriptors: FakeRow[],
  ): Pool {
    return padPool(
      pool,
      target,
      liveStart,
      liveEnd,
      descriptors.length,
      (i) => descriptors[i],
      (r) => r.identifier,
      (r) => r.eligible,
    );
  }

  test('no-op when pool already meets target', () => {
    const pool: Pool = [entry(0, 'a', 0), entry(1, 'b', 1)];
    const result = pad(pool, 2, 0, 1, makeDescriptors(['a', 'b', 'c']));
    expect(result).toEqual(pool);
  });

  test('top boundary: pads with rows below the live range', () => {
    const pool: Pool = [entry(0, 'a', 0), entry(1, 'b', 1), entry(2, 'c', 2)];
    const descriptors = makeDescriptors(['a', 'b', 'c', 'd', 'e', 'f', 'g']);
    // live range [0, 2]. Pad up to 5 → expect rows d, e from below.
    const result = pad(pool, 5, 0, 2, descriptors);
    expect(result).toHaveLength(5);
    const padded = result.slice(3);
    expect(padded.map((e) => e.rowId).sort()).toEqual(['d', 'e']);
    // Slots assigned should not collide with existing slots
    expect(padded[0].slot).not.toBe(0);
    expect(padded[0].slot).not.toBe(1);
    expect(padded[0].slot).not.toBe(2);
  });

  test('bottom boundary: pads with rows above the live range', () => {
    const pool: Pool = [entry(0, 'e', 4), entry(1, 'f', 5), entry(2, 'g', 6)];
    const descriptors = makeDescriptors(['a', 'b', 'c', 'd', 'e', 'f', 'g']);
    // live range [4, 6]. Pad up to 5 → expect rows d, c from above.
    const result = pad(pool, 5, 4, 6, descriptors);
    expect(result).toHaveLength(5);
    const padded = result.slice(3);
    expect(padded.map((e) => e.rowId).sort()).toEqual(['c', 'd']);
  });

  test('mid-data: pads alternately from both sides', () => {
    const pool: Pool = [entry(0, 'd', 3), entry(1, 'e', 4), entry(2, 'f', 5)];
    const descriptors = makeDescriptors([
      'a',
      'b',
      'c',
      'd',
      'e',
      'f',
      'g',
      'h',
    ]);
    // live range [3, 5]. Pad up to 5 → first take above (c), then below (g).
    const result = pad(pool, 5, 3, 5, descriptors);
    expect(result).toHaveLength(5);
    const padded = result.slice(3);
    expect(padded.map((e) => e.rowId).sort()).toEqual(['c', 'g']);
  });

  test('skips ineligible rows (e.g. placeholder / group header)', () => {
    const pool: Pool = [entry(0, 'a', 0)];
    const descriptors: { identifier: string; eligible: boolean }[] = [
      { identifier: 'a', eligible: true },
      { identifier: 'group1', eligible: false },
      { identifier: 'b', eligible: true },
      { identifier: 'placeholder', eligible: false },
      { identifier: 'c', eligible: true },
    ];
    const result = pad(pool, 3, 0, 0, descriptors);
    expect(result).toHaveLength(3);
    const padded = result.slice(1);
    expect(padded.map((e) => e.rowId)).toEqual(['b', 'c']);
  });

  test('skips rowIds already in the pool (no duplicates)', () => {
    const pool: Pool = [entry(0, 'a', 0), entry(5, 'c', 2)];
    const descriptors = makeDescriptors(['a', 'b', 'c', 'd']);
    // live range [0, 0] (just 'a' live). 'c' is already a ghost in the pool.
    // Pad up to 4 → take 'b', 'd' (not 'c' again).
    const result = pad(pool, 4, 0, 0, descriptors);
    expect(result).toHaveLength(4);
    const padded = result.slice(2);
    expect(padded.map((e) => e.rowId).sort()).toEqual(['b', 'd']);
  });

  test('runs out of candidates gracefully (small dataset)', () => {
    const pool: Pool = [entry(0, 'a', 0), entry(1, 'b', 1)];
    const descriptors = makeDescriptors(['a', 'b']);
    // Asking for 5 but only 2 rows total — pool stays at 2.
    const result = pad(pool, 5, 0, 1, descriptors);
    expect(result).toHaveLength(2);
  });

  test('assigns smallest unused slot integers', () => {
    const pool: Pool = [entry(0, 'a', 0), entry(2, 'b', 1)];
    const descriptors = makeDescriptors(['a', 'b', 'c', 'd']);
    const result = pad(pool, 4, 0, 1, descriptors);
    expect(result).toHaveLength(4);
    const padded = result.slice(2);
    // Should fill slot 1 (the smallest unused) and slot 3 next
    const paddedSlots = padded.map((e) => e.slot).sort((x, y) => x - y);
    expect(paddedSlots).toEqual([1, 3]);
  });

  test('empty pool with empty descriptors is a no-op', () => {
    const result = pad([], 5, 0, -1, []);
    expect(result).toEqual([]);
  });

  test('targetSize of 0 returns pool unchanged', () => {
    const pool: Pool = [entry(0, 'a', 0)];
    const result = pad(pool, 0, 0, 0, makeDescriptors(['a', 'b']));
    expect(result).toEqual(pool);
  });
});
