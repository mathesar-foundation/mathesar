<script lang="ts">
  import type {
    TableColumnData,
    TableRecords,
    TableRecordGroupData,
    TableDisplayData,
  } from '@mathesar/stores/tableData';
  import Row from './Row.svelte';
  import Resizer from './virtual-list/Resizer.svelte';
  import VirtualList from './virtual-list/VirtualList.svelte';

  export let columns: TableColumnData;
  export let data: TableRecords[];
  export let groupData: TableRecordGroupData;
  export let columnPosition: TableDisplayData['columnPosition'];
  export let scrollOffset = 0;
  export let horizontalScrollOffset = 0;

  // Be careful while accessing this ref.
  // Resizer may not have created it yet/destroyed it
  let virtualListRef: VirtualList;

  function computeDisplayRows(
    _rows: TableRecords[],
    _groupData: TableRecordGroupData,
  ): TableRecords[] {
    if (_groupData) {
      const newRows: TableRecords[] = [];
      for (let rowIndex = 0; rowIndex < _rows.length; rowIndex += 1) {
        const currRow = _rows[rowIndex];
        const prevRow = _rows[rowIndex - 1] || {};
        let insertRow = false;
        // eslint-disable-next-line no-restricted-syntax
        for (const field of _groupData.fields) {
          if (prevRow[field] !== currRow[field]) {
            insertRow = true;
          }
        }
        if (insertRow) {
          const keyArr = [];
          _groupData.fields.forEach((field) => {
            keyArr.push(currRow[field]);
          });
          const key = keyArr.join(',');
          const count = _groupData.count[key];
          const row = {
            __isGroupRow: true,
            key,
            count,
          };
          newRows.push({
            ...row,
          });
        }
        newRows.push({
          ...currRow,
          __index: rowIndex,
        });
      }
      return newRows;
    }
    return _rows;
  }

  $: rowsToDisplay = computeDisplayRows(data, groupData);

  function getItemSize(index: number) {
    if (data[index]?.__isGroupRow) {
      return 60;
    }
    return 30;
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
          <Row {columns}
                isGrouped={!!groupData} style={it.style}
                row={data[it.index] || {}}
                index={it.index}
                {columnPosition}/>
        {/if}
      {/each}
    </VirtualList>
  </Resizer>
</div>
