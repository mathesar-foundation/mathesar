<script lang="ts">
  /**
   * @file
   *
   * NOTICE: There is some code duplication between this file and
   * `CellTab.svelte` used for the data explorer. It might be good to resolve
   * this duplication at some point. In the meantime, be mindful of propagating
   * changes to both files as necessary.
   */
  import { _ } from 'svelte-i18n';

  import { getTabularDataStoreFromContext } from '@mathesar/stores/table-data';
  import ActiveCellValue from './ActiveCellValue.svelte';

  const tabularData = getTabularDataStoreFromContext();

  $: ({ selection } = $tabularData);
  $: ({ activeCellId } = $selection);
</script>

<div class="section-content">
  {#if activeCellId}
    <ActiveCellValue {activeCellId} />
  {:else}
    {$_('select_cell_view_properties')}
  {/if}
</div>

<style>
  .section-content {
    padding: var(--size-x-small);
  }
</style>
