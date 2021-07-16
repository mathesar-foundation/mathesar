<script lang="ts">
  import type {
    TableColumnData,
    TableRecord,
    ColumnPosition,
    GroupIndex,
  } from '@mathesar/stores/tableData';
  import {
    GROUP_ROW_HEIGHT,
  } from '@mathesar/stores/tableData';
  import Row from './Row.svelte';
  import Resizer from './virtual-list/Resizer.svelte';
  import VirtualList from './virtual-list/VirtualList.svelte';

  export let columns: TableColumnData;
  export let data: TableRecord[];
  export let columnPosition: ColumnPosition;
  export let scrollOffset = 0;
  export let horizontalScrollOffset = 0;
  export let groupIndex: GroupIndex;

  // Be careful while accessing this ref.
  // Resizer may not have created it yet/destroyed it
  let virtualListRef: VirtualList;

  function onGroupIndexChange(_groupIndex: GroupIndex) {
    if (_groupIndex.latest !== _groupIndex.previous) {
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

  export function scrollToPosition(_vScroll: number, _hScroll: number): void {
    if (virtualListRef) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      virtualListRef.scrollToPosition(_vScroll, _hScroll);
    }
  }
</script>

<div class="body">
  <Resizer let:height>
    <VirtualList
      bind:this={virtualListRef}
      bind:scrollOffset
      bind:horizontalScrollOffset
      {height}
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
                {columnPosition}/>
        {/if}
      {/each}
    </VirtualList>
  </Resizer>
</div>
