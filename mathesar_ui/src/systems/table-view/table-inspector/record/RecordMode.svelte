<script lang="ts">
  import { _ } from 'svelte-i18n';

  import { currentDatabase } from '@mathesar/stores/databases';
  import { currentSchema } from '@mathesar/stores/schemas';
  import { getTabularDataStoreFromContext } from '@mathesar/stores/table-data';
  import { getUserProfileStoreFromContext } from '@mathesar/stores/userProfile';
  import { Collapsible } from '@mathesar-component-library';

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
  $: selectedRowIds = $selection.rowIds;
  $: selectedRowCount = selectedRowIds.size;
</script>

<div class="column-mode-container">
  {#if selectedRowCount > 0}
    {#if selectedRowCount > 1}
      <span class="records-selected-count">
        {$_('multiple_records_selected', {
          values: { count: selectedRowCount },
        })}
      </span>
    {/if}
    <Collapsible isOpen triggerAppearance="plain">
      <CollapsibleHeader slot="header" title={$_('actions')} />
      <div slot="content" class="content-container">
        <RowActions
          {selectedRowIds}
          {recordsData}
          columnsDataStore={$tabularData.columnsDataStore}
          {canEditTableRecords}
        />
      </div>
    </Collapsible>
  {:else}
    <span class="no-records-selected">
      {$_('select_cells_view_record_props')}
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
