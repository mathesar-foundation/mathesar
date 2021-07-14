<script lang="ts">
  import type {
    TableColumnData,
    TableRecords,
    TableRecordGroupData,
    TableDisplayData,
  } from '@mathesar/stores/tableData';
  import { VirtualList } from '@mathesar-components';
  import Row from './Row.svelte';

  export let columns: TableColumnData;
  export let data: TableRecords[];
  export let groupData: TableRecordGroupData;
  export let columnPosition: TableDisplayData['columnPosition'];
  export let horizontalScrollOffset = 0;

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
</script>

<div class="body">
  <VirtualList itemCount={50000}
                bind:horizontalScrollOffset
                let:index let:style>
    <Row {columns}
          isGrouped={!!groupData} {style}
          row={rowsToDisplay[index] || {}} {index}
          {columnPosition}/>
  </VirtualList>
</div>
