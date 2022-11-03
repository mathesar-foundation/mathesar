<script lang="ts">
  import { Collapsible } from '@mathesar-component-library';
  import { getSelectedRowIndex } from '@mathesar/components/sheet';
  import { getTabularDataStoreFromContext } from '@mathesar/stores/table-data';
  import RowActions from './RowActions.svelte';

  const tabularData = getTabularDataStoreFromContext();
  $: ({ selection, recordsData } = $tabularData);
  $: ({ selectedCells } = selection);
  $: selectedRowIndices = $selectedCells
    .valuesArray()
    .map((cell) => getSelectedRowIndex(cell));
  $: uniquelySelectedRowIndices = Array.from(new Set(selectedRowIndices));
</script>

<div class="column-mode-container">
  {#if uniquelySelectedRowIndices.length}
    <Collapsible isOpen>
      <span slot="header">Actions</span>
      <div slot="content" class="actions-container">
        <RowActions
          selectedRowIndices={uniquelySelectedRowIndices}
          {recordsData}
          {selection}
        />
      </div>
    </Collapsible>
  {:else}
    <span>Select a cell to see record properties and actions</span>
  {/if}
</div>

<style>
  .column-mode-container {
    padding: 1rem 0;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .actions-container {
    padding: 1rem 0;
  }
</style>
