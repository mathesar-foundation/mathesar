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
 * Entries whose `rowId` is no longer present in the data (neither live nor
 * resolvable by `getGhostIndex`) are dropped — their slots return to the
 * integer pool.
 */

import type { ItemKey } from './listUtils';

export type PoolEntry = {
  slot: number;
  key: ItemKey;
  index: number;
};

export type Pool = PoolEntry[];

/**
 * Reconcile the slot pool against the current render's live items.
 *
 * Live items always get slotted: the caller passes their indices directly in
 * `liveItems`, so no lookup callback is consulted for them. The lookup is
 * only used to validate ghost entries — rows that were in the pool last
 * render but aren't live this render. If the lookup returns a current index
 * for a ghost's rowId, the ghost is kept (DOM preserved, index updated).
 * Otherwise the ghost is dropped.
 */
export function reconcilePool(
  prev: Pool,
  liveItems: ReadonlyMap<ItemKey, number>,
  getGhostIndex: (key: ItemKey) => number | undefined,
  capSize: number,
): Pool {
  const live: PoolEntry[] = [];
  const ghosts: PoolEntry[] = [];
  const usedSlots = new Set<number>();
  const droppedByMissing: PoolEntry[] = [];

  for (const entry of prev) {
    const liveIndex = liveItems.get(entry.key);
    if (liveIndex !== undefined) {
      live.push({ ...entry, index: liveIndex });
      usedSlots.add(entry.slot);
      continue;
    }

    const ghostIndex = getGhostIndex(entry.key);
    if (ghostIndex === undefined) {
      droppedByMissing.push(entry);
      continue; // row deleted; release slot
    }

    ghosts.push({ ...entry, index: ghostIndex });
    usedSlots.add(entry.slot);
  }

  if (droppedByMissing.length > 0) {
    // eslint-disable-next-line no-console
    console.log(
      '[reconcilePool] dropped',
      droppedByMissing.length,
      'entries (rowId vanished). Sample dropped rowIds:',
      droppedByMissing.slice(0, 3).map((e) => `${e.slot}:${e.key}`),
      '— prev pool size:',
      prev.length,
      'live count:',
      liveItems.size,
    );
  }

  const claimed = new Set<ItemKey>();
  for (const e of live) claimed.add(e.key);

  const newLive: PoolEntry[] = [];
  for (const [rowKey, index] of liveItems) {
    if (claimed.has(rowKey)) continue;

    let slot: number;
    const ghost = ghosts.shift();
    if (ghost !== undefined) {
      slot = ghost.slot;
    } else {
      slot = 0;
      while (usedSlots.has(slot)) slot += 1;
      usedSlots.add(slot);
    }
    newLive.push({ slot, key: rowKey, index });
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
 *   - rows for which `isRecyclable` returns false (placeholder, group
 *     header, help text — they're keyed separately, not by slot),
 *   - rowIds already in the pool (live or ghost).
 *
 * Slots taken are the smallest unused integers, never colliding with existing
 * pool slots.
 */
export function padPool(
  pool: Pool,
  targetSize: number,
  liveStart: number,
  liveEnd: number,
  totalCount: number,
  getIdentifierAt: (index: number) => ItemKey,
  isRecyclableAt: (index: number) => boolean,
): Pool {
  if (pool.length >= targetSize) return pool;
  if (totalCount <= 0) return pool;

  const usedRowIds = new Set(pool.map((e) => e.key));
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
    if (!isRecyclableAt(index)) return;
    const rowId = getIdentifierAt(index);
    if (usedRowIds.has(rowId)) return;
    usedRowIds.add(rowId);
    padded.push({ slot: nextSlot(), key: rowId, index });
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
