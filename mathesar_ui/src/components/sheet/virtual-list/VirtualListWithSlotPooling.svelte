<script lang="ts">
  import {
    DEFAULT_ESTIMATED_ITEM_SIZE,
    type Item,
    type ItemKey,
    type ItemKeyForSlotPooling,
    type Props,
    defaultItemKeyForSlotPooling,
  } from './listUtils';
  import { type Pool, padPool, reconcilePool } from './slotAllocator';
  import VirtualList from './VirtualList.svelte';

  // DEBUG: temporary diagnostics for verifying slot recycling.
  // Removed manually before merge.
  let lastKeysSnapshot: ItemKey[] = [];

  const CAP_FACTOR = 1.6;

  // VirtualList passthrough props.
  type Row = $$Generic;

  export let rows: Row[];

  let classes = 'default';
  export { classes as class };
  export let estimatedItemSize: number = DEFAULT_ESTIMATED_ITEM_SIZE;
  export let height: Props['height'];
  export let scrollOffset: Props['scrollOffset'] = 0;
  export let overscanCount: Props['overscanCount'] = 2;
  export let itemSize: Props['itemSize'] = (): number => estimatedItemSize;
  export let paddingBottom = 0;
  export let horizontalScrollOffset = 0;
  export let width: number | undefined = undefined;

  // Pool-specific props
  export let itemKeyForSlotPooling: (index: number) => ItemKeyForSlotPooling =
    defaultItemKeyForSlotPooling;
  export let alwaysRenderRows: ItemKey[] = [];
  export let indexByKey: ((id: ItemKey) => number | undefined) | undefined =
    undefined;

  const poolRef: { current: Pool } = { current: [] };
  const maxPoolSizeRef: { current: number } = { current: 0 };

  $: virtualListItemKey = (index: number) => itemKeyForSlotPooling(index).key;

  $: internalIndexByKey = (() => {
    if (indexByKey !== undefined) return indexByKey;
    let cache: Map<ItemKey, number> | undefined;
    return (id: ItemKey) => {
      if (cache === undefined) {
        cache = new Map();
        for (let i = 0; i < rows.length; i += 1) {
          cache.set(itemKeyForSlotPooling(i).key, i);
        }
      }
      return cache.get(id);
    };
  })();

  type Style = Item['style'];

  function makeOffscreenItem(
    index: number,
    getStyle: (i: number) => Style,
  ): Item {
    return {
      key: '', // filled by buildRender (slot:N or natural id)
      index,
      isScrolling: false,
      style: getStyle(index),
    };
  }

  function buildRender(
    liveFromVirtual: readonly Item[],
    getStyle: (i: number) => Style,
  ): Item[] {
    // Phase 1: live items from the virtual list, plus offscreen synthetics
    // for any always-render ids that aren't already live.
    const liveItems: Item[] = [...liveFromVirtual];
    const liveIndexes = new Set(liveFromVirtual.map((it) => it.index));

    for (const key of alwaysRenderRows) {
      const idx = internalIndexByKey(key);
      if (idx !== undefined && !liveIndexes.has(idx)) {
        liveItems.push(makeOffscreenItem(idx, getStyle));
        liveIndexes.add(idx);
      }
    }

    // Phase 2: build the live (rowId → index) map and the live-itemKey
    // cache for the emit phase. Non-recyclable items don't enter the pool.
    const liveByKey = new Map<ItemKey, number>();
    const itemKeyByIndex = new Map<number, ItemKeyForSlotPooling>();
    for (const item of liveItems) {
      const key = itemKeyForSlotPooling(item.index);
      itemKeyByIndex.set(item.index, key);
      if (key.recyclable) {
        liveByKey.set(key.key, item.index);
      }
    }

    // Steady-state estimate `S`: how many rows the virtual list renders for
    // this viewport. VirtualList's getRangeToRender rebalances overscan at
    // boundaries so this count is stable per viewport (independent of scroll
    // position).
    const firstIndex = liveFromVirtual[0]?.index;
    const lastIndex = liveFromVirtual[liveFromVirtual.length - 1]?.index;
    const steadyState = Math.min(liveFromVirtual.length, rows.length);

    // Cap `C` scales with the current steady state so memory tracks the
    // current viewport, not a stale high-water mark.
    const cap = Math.floor(steadyState * CAP_FACTOR);

    // Pad target `M` is the high-water steady state, clamped to the cap so
    // we never pad beyond what eviction would immediately reverse.
    const padTarget = Math.min(
      Math.max(maxPoolSizeRef.current, steadyState),
      cap,
    );
    maxPoolSizeRef.current = padTarget;

    const reconciled = reconcilePool(
      poolRef.current,
      liveByKey,
      internalIndexByKey,
      cap,
    );

    // Pad the reconciled pool with ghost entries from rows just outside the
    // live range. These DOMs mount offscreen at their natural offset; scroll
    // brings them into view without a fresh mount.
    const liveStart = firstIndex ?? 0;
    const liveEnd = lastIndex ?? -1;
    const newPool = padPool(
      reconciled,
      padTarget,
      liveStart,
      liveEnd,
      rows.length,
      (i) => itemKeyForSlotPooling(i).key,
      (i) => itemKeyForSlotPooling(i).recyclable,
    );
    poolRef.current = newPool;

    // Phase 3: emit pool entries in stable slot-index order so Svelte never
    // re-orders DOM children of the keyed each. Without this, items move
    // position when their row transitions between live and ghost, and
    // Svelte's insertBefore drops focus / interrupts edit mode.
    const liveItemByRowKey = new Map<ItemKey, Item>();
    for (const item of liveItems) {
      const key = itemKeyByIndex.get(item.index);
      if (key && key.recyclable) {
        liveItemByRowKey.set(key.key, item);
      }
    }

    const result: Item[] = [];
    const keys: ItemKey[] = [];

    const sortedPool = [...newPool].sort((a, b) => a.slot - b.slot);
    for (const entry of sortedPool) {
      const live = liveItemByRowKey.get(entry.key);
      const baseItem = live ?? makeOffscreenItem(entry.index, getStyle);
      const key = `slot:${entry.slot}`;
      result.push({ ...baseItem, key });
      keys.push(key);
    }

    // Non-recyclable live items emitted last with their natural ids as keys.
    for (const item of liveItems) {
      const key = itemKeyByIndex.get(item.index);
      if (key && !key.recyclable) {
        result.push({ ...item, key: key.key });
        keys.push(key.key);
      }
    }

    // DEBUG: log churn so we can spot regressions while iterating.
    const created = keys.filter((k) => !lastKeysSnapshot.includes(k));
    const destroyed = lastKeysSnapshot.filter((k) => !keys.includes(k));
    if (created.length || destroyed.length) {
      const classify = (k: ItemKey) => {
        if (String(k).startsWith('slot:')) return 'slot';
        if (String(k).startsWith('group-header')) return 'group';
        if (String(k).startsWith('help')) return 'help';
        if (String(k).startsWith('record-row')) return 'record/placeholder';
        return 'other';
      };
      const summary = (arr: ItemKey[]) =>
        arr.reduce<Record<ItemKey, number>>((acc, k) => {
          const cat = classify(k);
          acc[cat] = (acc[cat] ?? 0) + 1;
          return acc;
        }, {});
      // eslint-disable-next-line no-console
      console.log(
        `[slot-pool] +${created.length} -${destroyed.length} total:${
          keys.length
        } ghosts:${
          newPool.length - liveByKey.size
        } S: ${steadyState}, M: ${padTarget}, C: ${cap}, item length: ${
          liveFromVirtual.length
        }, itemCount: ${rows.length}`,
        JSON.stringify({
          created: summary(created),
          destroyed: summary(destroyed),
        }),
      );
    }
    lastKeysSnapshot = keys;

    return result;
  }
</script>

<VirtualList
  class={classes}
  {estimatedItemSize}
  {height}
  {scrollOffset}
  {rows}
  {overscanCount}
  {itemSize}
  {paddingBottom}
  {horizontalScrollOffset}
  itemKey={virtualListItemKey}
  {width}
  let:items
  let:api
  on:scroll
  on:h-scroll
>
  <slot items={buildRender(items, api.getStyle)} {api} />
</VirtualList>
