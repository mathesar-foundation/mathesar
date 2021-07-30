<script lang="ts">
  import type {
    TableRecord,
    GroupData,
  } from '@mathesar/stores/tableData';
  import {
    DEFAULT_COUNT_COL_WIDTH,
    GROUP_MARGIN_LEFT,
  } from '@mathesar/stores/tableData';

  export let style: string;
  export let row: TableRecord;
  export let groupData: GroupData;

  function getCount(_groupData: GroupData, _row: TableRecord): number {
    const columns = _row?.__groupInfo?.columns;
    if (columns) {
      let group = _groupData;
      const groupLength = columns.length;
      for (let i = 0; i < groupLength - 1; i += 1) {
        const value = _row?.[columns[i]] as string;
        if (!group?.[value]) {
          return 0;
        }
        group = group[value] as GroupData;
      }
      return group?.[_row?.[columns[groupLength - 1]] as string] as number || 0;
    }

    return 0;
  }

  $: count = getCount(groupData, row);
</script>

<div class="row group" style={style}>
  <div class="cell row-control" style="width:{DEFAULT_COUNT_COL_WIDTH}px;
                    left:{GROUP_MARGIN_LEFT}px">
    <div class="border"></div>
    <div class="content"></div>
  </div>
  <div class="cell values" style="left:{DEFAULT_COUNT_COL_WIDTH}px">
    {#each row.__groupInfo.columns as column (column)}
      <span class="tag">{column}: {row[column]}</span>
    {/each}
    {#if count}
      <span class="tag">COUNT: {count}</span>
    {/if}
  </div>
</div>
