<script lang="ts">
  import SelectableColumnTree from './SelectableColumnTree.svelte';
  import SelectableColumn from './SelectableColumn.svelte';
  import type QueryManager from '../../QueryManager';
  import TableGroupCollapsible from './TableGroupCollapsible.svelte';

  export let queryManager: QueryManager;

  $: ({ inputColumns } = queryManager);
  $: ({ baseTableColumns, tablesThatReferenceBaseTable } = $inputColumns);
</script>

<div>
  <section>
    <header>From Base table</header>
    {#each [...baseTableColumns] as [columnId, column] (columnId)}
      <SelectableColumn {column} on:add />
    {/each}
  </section>
  <section>
    <header>Linked from Base table</header>
    <SelectableColumnTree
      showColumnsWithoutLinks={false}
      columnsWithLinks={baseTableColumns}
      on:add
    />
  </section>
  {#if tablesThatReferenceBaseTable.size > 0}
    <section>
      <header>Linked to Base table</header>
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
    </section>
  {/if}
</div>

<style lang="scss">
  div {
    position: relative;
    padding: 0 var(--size-large);
  }
</style>
