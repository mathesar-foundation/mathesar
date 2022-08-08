<script lang="ts">
  import { Spinner } from '@mathesar-component-library';
  import SelectableColumnTree from './SelectableColumnTree.svelte';
  import type InputColumnsManager from '../InputColumnsManager';
  import TableGroupCollapsible from './TableGroupCollapsible.svelte';

  export let inputColumnsManager: InputColumnsManager;

  $: ({ inputColumns } = inputColumnsManager);
  $: ({ requestStatus, baseTableColumns, tablesThatReferenceBaseTable } =
    $inputColumns);
</script>

<aside>
  {#if requestStatus.state === 'success'}
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
  {:else if requestStatus.state === 'failure'}
    {requestStatus.errors.join(' ')}
  {:else}
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
