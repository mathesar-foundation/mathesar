<script lang="ts">
  import { currentDbAbstractTypes } from '@mathesar/stores/abstract-types';
  import { TabularData, Meta } from '@mathesar/stores/table-data';
  import Pagination from '@mathesar/utils/Pagination';
  import type { RecordSelectorController } from './RecordSelectorController';
  import RecordSelectorTable from './RecordSelectorTable.svelte';

  export let controller: RecordSelectorController;

  $: ({ tableId } = controller);
  $: tabularData = $tableId
    ? new TabularData({
        id: $tableId,
        abstractTypesMap: $currentDbAbstractTypes.data,
        meta: new Meta({ pagination: new Pagination({ size: 10 }) }),
      })
    : undefined;
</script>

{#if tabularData}
  <RecordSelectorTable {tabularData} {controller} />
{/if}
