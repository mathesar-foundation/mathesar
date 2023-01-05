<script lang="ts">
  import { Collapsible } from '@mathesar-component-library';
  import { getSelectedRowIndex } from '@mathesar/components/sheet';
  import { getTabularDataStoreFromContext } from '@mathesar/stores/table-data';
  import { labeledCount } from '@mathesar/utils/languageUtils';
  import CollapsibleHeader from '../CollapsibleHeader.svelte';
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
    {#if uniquelySelectedRowIndices.length > 1}
      <span class="records-selected-count">
        {labeledCount(uniquelySelectedRowIndices, 'records')} selected
      </span>
    {/if}
    <Collapsible isOpen triggerAppearance="plain">
      <CollapsibleHeader slot="header" title="Actions" />
      <div slot="content" class="content-container">
        <RowActions
          selectedRowIndices={uniquelySelectedRowIndices}
          {recordsData}
          {selection}
          columnsDataStore={$tabularData.columnsDataStore}
        />
      </div>
    </Collapsible>
  {:else}
    <span class="no-records-selected"
      >Select one or more cells to view associated record properties.</span
    >
  {/if}
</div>

<style lang="scss">
  .column-mode-container {
    padding-bottom: 1rem;
    display: flex;
    flex-direction: column;
  }

  .no-records-selected {
    padding: 2rem;
  }

  .records-selected-count {
    padding: 1rem;
  }

  .content-container {
    padding: 1rem;
    display: flex;
    flex-direction: column;

    > :global(* + *) {
      margin-top: 0.5rem;
    }
  }
</style>
