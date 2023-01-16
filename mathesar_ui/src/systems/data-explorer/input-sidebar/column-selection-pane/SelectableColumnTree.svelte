<script lang="ts">
  import type { Writable } from 'svelte/store';
  import type { ColumnWithLink } from '../../utils';
  import SelectableColumn from './SelectableColumn.svelte';
  import TableGroupCollapsible from './TableGroupCollapsible.svelte';
  import type QueryModel from '../../QueryModel';

  export let query: Writable<QueryModel>;
  export let linkCollapsibleOpenState: Record<ColumnWithLink['id'], boolean> =
    {};
  export let columnsWithLinks: Map<ColumnWithLink['id'], ColumnWithLink>;
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
          {query}
          on:add
        />
      </TableGroupCollapsible>
    {:else}
      <SelectableColumn
        {column}
        usageCount={$query.getColumnCount(columnId)}
        on:add
      />
    {/if}
  {/each}
</div>
