<script lang="ts">
  import SelectableColumnTree from './SelectableColumnTree.svelte';
  import type QueryManager from '../../QueryManager';
  import TableGroupCollapsible from './TableGroupCollapsible.svelte';

  export let queryManager: QueryManager;

  $: ({ inputColumns } = queryManager);
  $: ({ baseTableColumns, tablesThatReferenceBaseTable } = $inputColumns);
</script>

<div>
  <SelectableColumnTree columnsWithLinks={baseTableColumns} on:add />
  {#if tablesThatReferenceBaseTable.size > 0}
    <div data-identifier="referenced-by-tables">
      {#each [...tablesThatReferenceBaseTable] as [tableId, table] (tableId)}
        <TableGroupCollapsible
          tableName={table.name}
          column={table.referencedViaColumn}
          direction="out"
        >
          <SelectableColumnTree columnsWithLinks={table.columns} on:add />
        </TableGroupCollapsible>
      {/each}
    </div>
  {/if}
</div>

<style lang="scss">
  div {
    position: relative;
    padding: 0.75rem;
    flex-grow: 1;
    overflow: auto;
  }
</style>
