<script lang="ts">
  import { _ } from 'svelte-i18n';

  import { getTabularDataStoreFromContext } from '@mathesar/stores/table-data';
  import { Collapsible } from '@mathesar-component-library';

  import CollapsibleHeader from '../CollapsibleHeader.svelte';

  import RowActions from './RowActions.svelte';

  const tabularData = getTabularDataStoreFromContext();

  $: ({ table, selection, recordsData } = $tabularData);
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
          {table}
          {selectedRowIds}
          {recordsData}
          columnsDataStore={$tabularData.columnsDataStore}
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
