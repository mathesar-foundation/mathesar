<script lang="ts">
  import type { TableEntry } from '@mathesar/api/tables';
  import { Meta, TabularData } from '@mathesar/stores/table-data';
  import { currentDbAbstractTypes } from '@mathesar/stores/abstract-types';
  import RecordSummaryConfig from '@mathesar/systems/table-view/table-inspector/record-summary/RecordSummaryConfig.svelte';
  import Pagination from '@mathesar/utils/Pagination';

  export let table: TableEntry;

  $: abstractTypesMap = $currentDbAbstractTypes.data;
  $: tabularData = new TabularData({
    id: table.id,
    abstractTypesMap,
    meta: new Meta({ pagination: new Pagination({ size: 1 }) }),
  });
</script>

<RecordSummaryConfig {table} {tabularData} />
