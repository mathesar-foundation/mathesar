<script lang="ts">
  import { SheetVirtualRows } from '@mathesar/components/sheet';
  import { parseCellId } from '@mathesar/components/sheet/cellIds';
  import {
    GROUP_HEADER_ROW_HEIGHT_PX,
    HELP_TEXT_ROW_HEIGHT_PX,
    ROW_HEIGHT_PX,
  } from '@mathesar/geometry';
  import {
    type DisplayRowDescriptor,
    type Row as RowType,
    getTabularDataStoreFromContext,
    isDraftRecordRow,
    isGroupHeaderRow,
    isHelpTextRow,
    isPersistedRecordRow,
    isPlaceholderRecordRow,
  } from '@mathesar/stores/table-data';

  import Row from './row/Row.svelte';
  import ScrollAndRowHeightHandler from './ScrollAndRowHeightHandler.svelte';
  import { type Pool, reconcilePool } from './slotAllocator';

  // DEBUG: temporary diagnostics for verifying slot recycling
  const DEBUG_SLOTS = true;
  let lastKeysSnapshot: string[] = [];

  /**
   * Maximum number of slot DOMs we keep mounted. Live rows + ghosts (rows that
   * scrolled out but whose DOM we retain for cheap re-entry) sum to at most
   * this. Larger means more memory, fewer mount/unmount events near data
   * boundaries; smaller means the opposite.
   */
  const POOL_CAP = 60;

  const tabularData = getTabularDataStoreFromContext();

  export let usesVirtualList = false;

  $: ({ table, display, canInsertRecords, selection } = $tabularData);
  $: ({ oid } = table);
  $: ({ displayRowDescriptors, placeholderRowId } = display);

  $: activeRowId = $selection.activeCellId
    ? parseCellId($selection.activeCellId).rowId
    : undefined;

  $: rowIndexById = (() => {
    const map = new Map<string, number>();
    $displayRowDescriptors.forEach((d, i) => map.set(d.row.identifier, i));
    return map;
  })();

  // Persistent pool. Held in a ref so reassignments don't trigger additional
  // reactive passes — buildRender mutates this in place each render.
  const poolRef: { current: Pool } = { current: [] };

  // Reset the pool when the user switches tables.
  let lastOid: number | undefined;
  $: if (oid !== lastOid) {
    poolRef.current = [];
    lastOid = oid;
  }

  function getItemSizeFromRow(row: RowType) {
    if (isHelpTextRow(row)) {
      return HELP_TEXT_ROW_HEIGHT_PX;
    }
    if (isGroupHeaderRow(row)) {
      return GROUP_HEADER_ROW_HEIGHT_PX;
    }
    return ROW_HEIGHT_PX;
  }

  /** See notes in `records.ts.README.md` about different row identifiers */
  function getIterationKey(
    index: number,
    rowDescriptor: DisplayRowDescriptor | undefined,
  ): string {
    if (rowDescriptor) {
      return rowDescriptor.row.identifier;
    }
    return `__index_${index}`;
  }

  function getItemSizeFromIndex(index: number) {
    const row = $displayRowDescriptors?.[index].row;
    return row ? getItemSizeFromRow(row) : ROW_HEIGHT_PX;
  }

  function isPoolRow(row: RowType): boolean {
    return isPersistedRecordRow(row) || isDraftRecordRow(row);
  }

  type RenderItem = {
    index: number;
    style: { [key: string]: string | number };
    isScrolling: boolean;
  };

  function offsetForIndex(targetIndex: number): number {
    let offset = 0;
    for (let i = 0; i < targetIndex; i += 1) {
      offset += getItemSizeFromIndex(i);
    }
    return offset;
  }

  function makeOffscreenItem(index: number): RenderItem {
    return {
      index,
      isScrolling: false,
      style: {
        position: 'absolute',
        left: 0,
        top: offsetForIndex(index),
        height: getItemSizeFromIndex(index),
        width: '100%',
      },
    };
  }

  function buildRender(
    items: readonly RenderItem[],
    descriptors: DisplayRowDescriptor[],
    activeId: string | undefined,
    placeholderId: string,
    canInsert: boolean,
  ): { renderItems: RenderItem[]; keys: string[] } {
    // Phase 1: live items from the virtual list, plus offscreen synthetics
    // for the placeholder (always rendered when insertable) and the active
    // row (when active is a pool row that's scrolled out of view).
    const liveItems: RenderItem[] = [...items];
    const liveIndexes = new Set(items.map((it) => it.index));

    if (canInsert) {
      const placeholderIndex = rowIndexById.get(placeholderId);
      if (
        placeholderIndex !== undefined &&
        !liveIndexes.has(placeholderIndex)
      ) {
        liveItems.push(makeOffscreenItem(placeholderIndex));
        liveIndexes.add(placeholderIndex);
      }
    }

    if (activeId !== undefined) {
      const activeIndex = rowIndexById.get(activeId);
      if (activeIndex !== undefined && !liveIndexes.has(activeIndex)) {
        const activeRow = descriptors[activeIndex]?.row;
        if (activeRow && isPoolRow(activeRow)) {
          liveItems.push(makeOffscreenItem(activeIndex));
          liveIndexes.add(activeIndex);
        }
      }
    }

    // Phase 2: identify which live items are pool rows. The pool reconciler
    // assigns each pool row a stable slot. Non-pool rows (placeholder, group,
    // help) keep their identifier as the each-block key.
    const liveRowIds = new Set<string>();
    for (const item of liveItems) {
      const row = descriptors[item.index]?.row;
      if (row && isPoolRow(row)) liveRowIds.add(row.identifier);
    }

    const newPool = reconcilePool(
      poolRef.current,
      liveRowIds,
      rowIndexById,
      POOL_CAP,
    );
    poolRef.current = newPool;

    // Phase 3: emit pool entries in stable slot-index order so Svelte never
    // re-orders DOM children of the keyed each. Without this, the active row
    // moves position when its row transitions between in-items and ghost,
    // and Svelte's insertBefore drops focus / interrupts edit mode.
    const liveItemByRowId = new Map<string, RenderItem>();
    for (const item of liveItems) {
      const row = descriptors[item.index]?.row;
      if (row && isPoolRow(row)) liveItemByRowId.set(row.identifier, item);
    }

    const renderItems: RenderItem[] = [];
    const keys: string[] = [];

    const sortedPool = [...newPool].sort((a, b) => a.slot - b.slot);
    for (const entry of sortedPool) {
      const live = liveItemByRowId.get(entry.rowId);
      renderItems.push(live ?? makeOffscreenItem(entry.index));
      keys.push(`slot:${entry.slot}`);
    }

    // Non-pool live items (placeholder, group, help) emitted last. Their
    // keys / DOM may churn across derives — that's existing behavior we don't
    // touch here.
    for (const item of liveItems) {
      const row = descriptors[item.index]?.row;
      if (row && !isPoolRow(row)) {
        renderItems.push(item);
        keys.push(row.identifier);
      }
    }

    if (DEBUG_SLOTS) {
      const created = keys.filter((k) => !lastKeysSnapshot.includes(k));
      const destroyed = lastKeysSnapshot.filter((k) => !keys.includes(k));
      if (created.length || destroyed.length) {
        const classify = (k: string) => {
          if (k.startsWith('slot:')) return 'slot';
          if (k.startsWith('group-header')) return 'group';
          if (k.startsWith('help')) return 'help';
          if (k.startsWith('record-row')) return 'record/placeholder';
          return 'other';
        };
        const summary = (arr: string[]) =>
          arr.reduce<Record<string, number>>((acc, k) => {
            const cat = classify(k);
            acc[cat] = (acc[cat] ?? 0) + 1;
            return acc;
          }, {});
        // eslint-disable-next-line no-console
        console.log(
          `[slot-pool] +${created.length} -${destroyed.length} total:${
            keys.length
          } ghosts:${newPool.length - liveRowIds.size}`,
          JSON.stringify({
            created: summary(created),
            destroyed: summary(destroyed),
          }),
        );
      }
      lastKeysSnapshot = keys;
    }

    return { renderItems, keys };
  }
</script>

{#key oid}
  {#if usesVirtualList}
    <SheetVirtualRows
      itemCount={$displayRowDescriptors.length}
      paddingBottom={30}
      itemSize={getItemSizeFromIndex}
      itemKey={(index) => getIterationKey(index, $displayRowDescriptors[index])}
      let:items
      let:api
    >
      <ScrollAndRowHeightHandler {api} />
      {@const result = buildRender(
        items,
        $displayRowDescriptors,
        activeRowId,
        $placeholderRowId,
        $canInsertRecords,
      )}
      {#each result.renderItems as item, i (result.keys[i])}
        {@const desc = $displayRowDescriptors[item.index]}
        {@const shouldRender = !(
          desc &&
          isPlaceholderRecordRow(desc.row) &&
          !$canInsertRecords
        )}
        {#if desc && shouldRender}
          <Row style={item.style} row={desc.row} rowDescriptor={desc} />
        {/if}
      {/each}
    </SheetVirtualRows>
  {:else}
    {#each $displayRowDescriptors as displayRowDescriptor (displayRowDescriptor)}
      <Row
        style={{
          position: 'relative',
          height: getItemSizeFromRow(displayRowDescriptor.row),
        }}
        row={displayRowDescriptor.row}
        rowDescriptor={displayRowDescriptor}
      />
    {/each}
  {/if}
{/key}
