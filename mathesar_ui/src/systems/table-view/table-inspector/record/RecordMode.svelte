<script lang="ts">
  import { _ } from 'svelte-i18n';

  import InspectorSection from '@mathesar/components/InspectorSection.svelte';
  import { getTabularDataStoreFromContext } from '@mathesar/stores/table-data';

  import RowActions from './RowActions.svelte';

  const tabularData = getTabularDataStoreFromContext();

  $: ({ selection } = $tabularData);
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

    <InspectorSection title={$_('actions')}>
      <RowActions />
    </InspectorSection>
  {:else}
    <span class="no-records-selected">
      {$_('select_cells_view_record_props')}
    </span>
  {/if}
</div>

<style lang="scss">
  .column-mode-container {
    padding-bottom: var(--sm1);
    display: flex;
    flex-direction: column;
  }

  .no-records-selected {
    padding: 2rem;
  }

  .records-selected-count {
    padding: var(--lg1);
  }
</style>
