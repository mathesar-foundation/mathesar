<script lang="ts">
  import { States } from '@mathesar/utils/api';
  import type {
    TableColumnData,
    TableRecords,
    TableRecordGroupData,
  } from '@mathesar/stores/tableData';
  import Row from './Row.svelte';

  export let columns: TableColumnData;
  export let data: TableRecords[];
  export let groupData: TableRecordGroupData;
  export let state: States;
  export let offset: number;

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

<tbody>
  {#each rowsToDisplay as row, index (row)}
    <Row {columns} loading={state === States.Loading}
          isGrouped={!!groupData}
          {row} {index} {offset}/>
  {/each}
</tbody>
