/**
 * Persistent slot pool with ghosts for the virtual list.
 *
 * Each pool row that has been mounted holds a slot index. When a row scrolls
 * out of the rendered window we keep its entry as a "ghost" so its slot stays
 * in the keyed-each block (DOM preserved, rendered offscreen). When a new row
 * enters we prefer to take a ghost's slot — a single DOM swap that updates
 * props rather than create+destroy. Ghosts are bounded by `capSize`; when
 * exceeded, the oldest ghost is evicted (its DOM is unmounted).
 *
 * Entries whose `rowId` is no longer present in `descriptorIndexByRowId`
 * (rows truly deleted) are dropped — their slots return to the integer pool.
 */

export type PoolEntry = {
  slot: number;
  rowId: string;
  index: number;
};

export type Pool = PoolEntry[];

export function reconcilePool(
  prev: Pool,
  liveRowIds: ReadonlySet<string>,
  descriptorIndexByRowId: ReadonlyMap<string, number>,
  capSize: number,
): Pool {
  const live: PoolEntry[] = [];
  const ghosts: PoolEntry[] = [];
  const usedSlots = new Set<number>();
  const droppedByMissing: PoolEntry[] = [];

  for (const entry of prev) {
    const currentIndex = descriptorIndexByRowId.get(entry.rowId);
    if (currentIndex === undefined) {
      droppedByMissing.push(entry);
      continue; // row deleted; release slot
    }

    const updated: PoolEntry = { ...entry, index: currentIndex };
    if (liveRowIds.has(entry.rowId)) {
      live.push(updated);
    } else {
      ghosts.push(updated);
    }
    usedSlots.add(entry.slot);
  }

  if (droppedByMissing.length > 0) {
    // eslint-disable-next-line no-console
    console.log(
      '[reconcilePool] dropped',
      droppedByMissing.length,
      'entries (rowId vanished). Sample dropped rowIds:',
      droppedByMissing.slice(0, 3).map((e) => `${e.slot}:${e.rowId}`),
      '— prev liveRowIds count:',
      prev.length,
      'new liveRowIds count:',
      liveRowIds.size,
      'descriptorIndex size:',
      descriptorIndexByRowId.size,
    );
  }

  const claimed = new Set<string>();
  for (const e of live) claimed.add(e.rowId);
  for (const e of ghosts) claimed.add(e.rowId);

  const newLive: PoolEntry[] = [];
  for (const rowId of liveRowIds) {
    if (claimed.has(rowId)) continue;
    const index = descriptorIndexByRowId.get(rowId);
    if (index === undefined) continue;

    let slot: number;
    const ghost = ghosts.shift();
    if (ghost !== undefined) {
      slot = ghost.slot;
    } else {
      slot = 0;
      while (usedSlots.has(slot)) slot += 1;
      usedSlots.add(slot);
    }
    newLive.push({ slot, rowId, index });
  }

  while (live.length + newLive.length + ghosts.length > capSize) {
    if (ghosts.length === 0) break;
    ghosts.shift();
  }

  return [...live, ...newLive, ...ghosts];
}

/**
 * Pad the pool up to `targetSize` with ghost entries pulled from descriptor
 * indices immediately outside the live range. Used to:
 *   - pre-mount overscan-side rows at top/bottom boundaries (so the rendered
 *     window doesn't grow row-by-row as the user scrolls off the boundary), and
 *   - hold the pool at its high-water size across events that would otherwise
 *     shrink it (e.g. refresh re-fetches all row identifiers).
 *
 * Candidates are picked alternately from above and below the live range,
 * starting closest to the range and expanding outward. Skips:
 *   - indices outside `[0, totalCount)`,
 *   - rows for which `isPoolEligible` returns false (placeholder, group
 *     header, help text — they're keyed separately, not by slot),
 *   - rowIds already in the pool (live or ghost).
 *
 * Slots taken are the smallest unused integers, never colliding with existing
 * pool slots.
 */
export function padPool<R>(
  pool: Pool,
  targetSize: number,
  liveStart: number,
  liveEnd: number,
  totalCount: number,
  getRowAt: (index: number) => R | undefined,
  getIdentifier: (row: R) => string,
  isPoolEligible: (row: R) => boolean,
): Pool {
  if (pool.length >= targetSize) return pool;
  if (totalCount <= 0) return pool;

  const usedRowIds = new Set(pool.map((e) => e.rowId));
  const usedSlots = new Set(pool.map((e) => e.slot));
  const padded: PoolEntry[] = [];

  function nextSlot(): number {
    let slot = 0;
    while (usedSlots.has(slot)) slot += 1;
    usedSlots.add(slot);
    return slot;
  }

  function tryAdd(index: number): void {
    if (index < 0 || index >= totalCount) return;
    const row = getRowAt(index);
    if (row === undefined) return;
    if (!isPoolEligible(row)) return;
    const rowId = getIdentifier(row);
    if (usedRowIds.has(rowId)) return;
    usedRowIds.add(rowId);
    padded.push({ slot: nextSlot(), rowId, index });
  }

  let above = liveStart - 1;
  let below = liveEnd + 1;
  while (
    pool.length + padded.length < targetSize &&
    (above >= 0 || below < totalCount)
  ) {
    if (above >= 0) {
      tryAdd(above);
      above -= 1;
    }
    if (pool.length + padded.length >= targetSize) break;
    if (below < totalCount) {
      tryAdd(below);
      below += 1;
    }
  }

  return [...pool, ...padded];
}
