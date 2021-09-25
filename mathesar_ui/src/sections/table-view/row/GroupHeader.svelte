<script lang="ts">
  import {
    ROW_CONTROL_COLUMN_WIDTH,
  } from '@mathesar/stores/table-data';
  import type {
    TableRecord,
    GroupData,
  } from '@mathesar/stores/table-data/types';

  export let row: TableRecord;
  export let groupData: GroupData;

  function getCount(_groupData: GroupData, _row: TableRecord): number {
    const columns = _row?.__groupInfo?.columns;
    if (columns) {
      let group = _groupData;
      const groupLength = columns.length;
      for (let i = 0; i < groupLength - 1; i += 1) {
        const value = _row?.__groupInfo.values[columns[i]] as string;
        if (!group?.[value]) {
          return 0;
        }
        group = group[value] as GroupData;
      }
      return group?.[_row?.__groupInfo.values[columns[groupLength - 1]] as string] as number || 0;
    }

    return 0;
  }

  $: count = getCount(groupData, row);
</script>

<div class="cell groupheader" style="left:{ROW_CONTROL_COLUMN_WIDTH}px;width:100%">
  {#each row.__groupInfo.columns as column (column)}
    <span class="tag">{column}: {row.__groupInfo.values[column]}</span>
  {/each}
  {#if count}
    <span class="tag">Count: {count}</span>
  {/if}
</div>
