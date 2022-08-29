<script lang="ts">
  import { Spinner } from '@mathesar-component-library';
  import SelectableColumnTree from './SelectableColumnTree.svelte';
  import type QueryManager from '../QueryManager';
  import TableGroupCollapsible from './TableGroupCollapsible.svelte';

  export let queryManager: QueryManager;

  $: ({ inputColumns, state } = queryManager);
  $: ({ inputColumnsFetchState } = $state);
  $: ({ baseTableColumns, tablesThatReferenceBaseTable } = $inputColumns);
</script>

<aside>
  {#if inputColumnsFetchState?.state === 'success'}
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
  {:else if inputColumnsFetchState?.state === 'failure'}
    {inputColumnsFetchState.errors.join(' ')}
  {:else if inputColumnsFetchState?.state === 'processing'}
    <Spinner />
  {/if}
</aside>

<style lang="scss">
  aside {
    position: relative;
    padding: 0.75rem;
    flex-grow: 1;
    overflow: auto;
  }
</style>
