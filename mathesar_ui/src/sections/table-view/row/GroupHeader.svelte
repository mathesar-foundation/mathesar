<script lang="ts">
  import {
    ROW_CONTROL_COLUMN_WIDTH,
  } from '@mathesar/stores/table-data';
  import type {
    TableRecord,
    GroupCount,
  } from '@mathesar/stores/table-data/types';

  export let row: TableRecord;
  export let groupCounts: GroupCount;
  export let groupColumns: string[];

  function getCount(_groupCounts: GroupCount, _row: TableRecord): number {
    if (groupColumns) {
      let group = _groupCounts;
      const groupLength = groupColumns.length;
      for (let i = 0; i < groupLength - 1; i += 1) {
        const value = _row?.__groupValues[groupColumns[i]] as string;
        if (!group?.[value]) {
          return 0;
        }
        group = group[value] as GroupCount;
      }
      return group?.[
        _row?.__groupValues[groupColumns[groupLength - 1]] as string
      ] as number || 0;
    }

    return 0;
  }

  $: count = getCount(groupCounts, row);
</script>

<div class="cell groupheader" style="left:{ROW_CONTROL_COLUMN_WIDTH}px;width:100%">
  {#each groupColumns as column (column)}
    <span class="tag">{column}: {row.__groupValues[column]}</span>
  {/each}
  {#if count}
    <span class="tag">Count: {count}</span>
  {/if}
</div>
