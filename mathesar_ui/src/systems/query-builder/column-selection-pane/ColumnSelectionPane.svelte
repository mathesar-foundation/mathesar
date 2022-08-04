<script lang="ts">
  import { Collapsible, Spinner } from '@mathesar-component-library';
  import SelectableColumnTree from './SelectableColumnTree.svelte';
  import type InputColumnsManager from '../InputColumnsManager';

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
          <Collapsible>
            <div slot="header" class="column-name">
              <div>{table.name}</div>
              <div>
                {table.referencedViaColumn.name} -> {table.linkedToColumn.name}
              </div>
            </div>
            <div class="column-list" slot="content">
              <SelectableColumnTree columnsWithLinks={table.columns} on:add />
            </div>
          </Collapsible>
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

    :global(.collapsible) {
      margin: 0.7rem 0;
    }
    :global(.collapsible .collapsible-header) {
      padding: 0.5rem 0.75rem;
      border: 1px solid #dfdfdf;
      border-radius: 2px;
      margin: 0.7rem 0;
      cursor: pointer;
      display: flex;
      align-items: center;
    }
    :global(.collapsible .collapsible-content .column-list) {
      margin-top: 0.7rem;
      margin-left: 1rem;
    }
    [data-identifier='referenced-by-tables'] {
      border-top: 2px solid #dfdfdf;
      margin-top: 1.2rem;
      padding-top: 0.3rem;
    }
  }
</style>
