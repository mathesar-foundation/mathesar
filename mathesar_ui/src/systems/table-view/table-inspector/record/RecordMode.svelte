<script lang="ts">
  import { Collapsible } from '@mathesar-component-library';
  import { getTabularDataStoreFromContext } from '@mathesar/stores/table-data';
  import { getSelectedRowId } from '@mathesar/stores/table-data/selection';
  import RowActions from './RowActions.svelte';

  const tabularData = getTabularDataStoreFromContext();
  $: ({ selection, recordsData } = $tabularData);
  $: ({ selectedCells } = selection);
  $: selectedRowsId = $selectedCells
    .valuesArray()
    .map((cell) => getSelectedRowId(cell));
  $: uniquelySelectedRowsId = Array.from(new Set(selectedRowsId));
</script>

<div class="column-mode-container">
  {#if uniquelySelectedRowsId.length}
    <Collapsible isOpen>
      <span slot="header">Actions</span>
      <div slot="content" class="actions-container">
        <RowActions
          selectedRoweKey={uniquelySelectedRowsId}
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
