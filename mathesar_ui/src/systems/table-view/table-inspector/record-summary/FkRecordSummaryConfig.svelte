<script lang="ts">
  import type { Table } from '@mathesar/api/rpc/tables';
  import { currentDbAbstractTypes } from '@mathesar/stores/abstract-types';
  import { currentDatabase } from '@mathesar/stores/databases';
  import { Meta, TabularData } from '@mathesar/stores/table-data';
  import RecordSummaryConfig from '@mathesar/systems/table-view/table-inspector/record-summary/RecordSummaryConfig.svelte';
  import Pagination from '@mathesar/utils/Pagination';

  export let table: Table;

  $: abstractTypesMap = $currentDbAbstractTypes.data;
  $: tabularData = new TabularData({
    database: $currentDatabase,
    table,
    abstractTypesMap,
    meta: new Meta({ pagination: new Pagination({ size: 1 }) }),
  });
</script>

<RecordSummaryConfig {table} {tabularData} />
