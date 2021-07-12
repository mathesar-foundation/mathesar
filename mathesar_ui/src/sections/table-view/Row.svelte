<script lang="ts">
  import type {
    TableColumnData,
  } from '@mathesar/stores/tableData';
  import { Skeleton } from '@mathesar-components';

  export let offset: number;
  export let index: number;
  export let columns: TableColumnData;
  export let loading = false;
  export let isGrouped = false;
  export let row: { [key: string]: unknown };

  $: rowNumber = isGrouped
    ? offset + (row.__index as number)
    : offset + index;
</script>

<tr>
  {#if row.__isGroupRow}
    <td colspan={columns.data.length + 1}>
      {row.key}: {row.count}
    </td>

  {:else}
    <td class="row-number">
      {rowNumber}
    </td>
    {#each columns.data as column (column.name)}
      <td>
        {row[column.name]}
        <Skeleton {loading}/>
      </td>
    {/each}
  {/if}
</tr>
