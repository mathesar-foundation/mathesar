<script lang="ts">
  import type {
    TableColumnData,
    TableRecord,
    ColumnPosition,
    GroupIndex,
    GroupData,
  } from '@mathesar/stores/tableData';
  import {
    GROUP_ROW_HEIGHT,
    DEFAULT_ROW_RIGHT_PADDING,
    GROUP_MARGIN_LEFT,
  } from '@mathesar/stores/tableData';
  import Row from './row/Row.svelte';
  import Resizer from './virtual-list/Resizer.svelte';
  import VirtualList from './virtual-list/VirtualList.svelte';

  export let id: number;
  export let columns: TableColumnData;
  export let data: TableRecord[];
  export let groupData: GroupData;
  export let columnPosition: ColumnPosition;
  export let scrollOffset = 0;
  export let horizontalScrollOffset = 0;
  export let groupIndex: GroupIndex;
  export let selected: Record<string | number, boolean>;

  let rowWidth: number;
  let widthWithPadding: number;
  $: rowWidth = columnPosition?.get('__row')?.width || null;
  $: widthWithPadding = rowWidth ? rowWidth + DEFAULT_ROW_RIGHT_PADDING : null;
  $: totalWidth = widthWithPadding ? widthWithPadding + GROUP_MARGIN_LEFT : null;

  // Be careful while accessing this ref.
  // Resizer may not have created it yet/destroyed it
  let virtualListRef: VirtualList;

  function onGroupIndexChange(_groupIndex: GroupIndex) {
    if (!_groupIndex.bailOutOnReset && _groupIndex.latest !== _groupIndex.previous) {
      // eslint-disable-next-line no-param-reassign
      _groupIndex.previous = _groupIndex.latest;

      if (virtualListRef) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        virtualListRef.resetAfterIndex(_groupIndex.latest);
      }
    }
  }

  $: onGroupIndexChange(groupIndex);

  function getItemSize(index: number) {
    const defaultRowHeight = 30;
    if (data[index]?.__groupInfo) {
      return GROUP_ROW_HEIGHT + defaultRowHeight;
    }
    return defaultRowHeight;
  }

  function getItemKey(index: number): number | string {
    // Check and return primary key
    // Return index by default
    return `__index_${index}`;
  }

  export function reloadPositions(resetPositions: boolean): void {
    if (virtualListRef) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      virtualListRef.scrollToPosition(0, 0);
      if (resetPositions) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        virtualListRef.resetAfterIndex(0);
      }
    }
  }
</script>

<div class="body">
  <Resizer let:height>
    {#key id}
      <VirtualList
        bind:this={virtualListRef}
        bind:scrollOffset
        bind:horizontalScrollOffset
        {height}
        width={totalWidth || null}
        itemCount={data.length}
        paddingBottom={100}
        itemSize={getItemSize}
        itemKey={getItemKey}
        on:refetch
        let:items
        >
        {#each items as it (it?.key || it)}
          {#if it}
            <Row {columns} style={it.style}
                  row={data[it.index] || {}}
                  index={it.index}
                  {groupData}
                  isGrouped={!!groupData}
                  {columnPosition}
                  bind:selected/>
          {/if}
        {/each}

        {#if groupData}
          <div class="group-padding"></div>
        {/if}
      </VirtualList>
    {/key}
  </Resizer>
</div>
