<script lang="ts">
  import type {
    TableColumnData,
  } from '@mathesar/stores/tableData';
  import { Skeleton } from '@mathesar-components';

  export let offset: number;
  export let index: number;
  export let columns: TableColumnData;
  export let loading = false;
  export let row: { [key: string]: unknown };
</script>

<tr>
  <td class="row-number">
    {offset + index}
  </td>
  {#each columns.data as column (column.name)}
    <td>
      {row[column.name]}
      <Skeleton {loading}/>
    </td>
  {/each}
</tr>
