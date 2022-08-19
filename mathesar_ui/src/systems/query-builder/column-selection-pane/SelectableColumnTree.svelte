<script lang="ts">
  import type { ColumnWithLink } from '../QueryManager';
  import SelectableColumn from './SelectableColumn.svelte';
  import TableGroupCollapsible from './TableGroupCollapsible.svelte';

  export let columnsWithLinks: Map<ColumnWithLink['id'], ColumnWithLink>;
</script>

<div class="selectable-column-tree">
  {#each [...columnsWithLinks] as [columnId, column] (columnId)}
    {#if column.linksTo}
      <TableGroupCollapsible
        tableName={column.linksTo.name}
        direction="in"
        {column}
      >
        <svelte:self columnsWithLinks={column.linksTo.columns} on:add />
      </TableGroupCollapsible>
    {:else}
      <SelectableColumn {column} on:add />
    {/if}
  {/each}
</div>
