<script lang="ts">
  import { Collapsible } from '@mathesar-component-library';
  import { currentDatabase } from '@mathesar/stores/databases';
  import { currentSchema } from '@mathesar/stores/schemas';
  import { getTabularDataStoreFromContext } from '@mathesar/stores/table-data';
  import { getUserProfileStoreFromContext } from '@mathesar/stores/userProfile';
  import { labeledCount } from '@mathesar/utils/languageUtils';
  import CollapsibleHeader from '../CollapsibleHeader.svelte';
  import RowActions from './RowActions.svelte';

  const tabularData = getTabularDataStoreFromContext();
  const userProfile = getUserProfileStoreFromContext();

  $: database = $currentDatabase;
  $: schema = $currentSchema;
  $: ({ selection, recordsData } = $tabularData);
  $: canEditTableRecords = !!$userProfile?.hasPermission(
    { database, schema },
    'canEditTableRecords',
  );
  $: selectedRowCount = $selection.rowIds.size;

  // TODO_3037 Need to calculate selectedRowIndices. This might be a deeper
  // problem. Seems like we might need access to the row index here instead of
  // the row identifier.
  $: selectedRowIndices = [];
</script>

<div class="column-mode-container">
  {#if selectedRowCount > 0}
    {#if selectedRowCount > 1}
      <span class="records-selected-count">
        {labeledCount(selectedRowCount, 'records')} selected
      </span>
    {/if}
    <Collapsible isOpen triggerAppearance="plain">
      <CollapsibleHeader slot="header" title="Actions" />
      <div slot="content" class="content-container">
        <RowActions
          {selectedRowIndices}
          {recordsData}
          columnsDataStore={$tabularData.columnsDataStore}
          {canEditTableRecords}
        />
      </div>
    </Collapsible>
  {:else}
    <span class="no-records-selected">
      Select one or more cells to view associated record properties.
    </span>
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
