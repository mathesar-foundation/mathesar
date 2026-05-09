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

  for (const entry of prev) {
    const currentIndex = descriptorIndexByRowId.get(entry.rowId);
    if (currentIndex === undefined) continue; // row deleted; release slot

    const updated: PoolEntry = { ...entry, index: currentIndex };
    if (liveRowIds.has(entry.rowId)) {
      live.push(updated);
    } else {
      ghosts.push(updated);
    }
    usedSlots.add(entry.slot);
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
