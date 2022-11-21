<script lang="ts">
  import type { ColumnWithLink } from '../../utils';
  import SelectableColumn from './SelectableColumn.svelte';
  import TableGroupCollapsible from './TableGroupCollapsible.svelte';

  export let linkCollapsibleOpenState: Record<ColumnWithLink['id'], boolean> =
    {};
  export let columnsWithLinks: Map<ColumnWithLink['id'], ColumnWithLink>;
  export let showColumnsWithoutLinks = true;
</script>

<div class="selectable-column-tree">
  {#each [...columnsWithLinks] as [columnId, column] (columnId)}
    {#if column.linksTo}
      <TableGroupCollapsible
        tableName={column.linksTo.name}
        {column}
        {linkCollapsibleOpenState}
      >
        <svelte:self
          {linkCollapsibleOpenState}
          columnsWithLinks={column.linksTo.columns}
          on:add
        />
      </TableGroupCollapsible>
    {:else if showColumnsWithoutLinks}
      <SelectableColumn {column} on:add />
    {/if}
  {/each}
</div>
