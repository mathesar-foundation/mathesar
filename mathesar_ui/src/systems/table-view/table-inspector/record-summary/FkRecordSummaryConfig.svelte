<script lang="ts">
  import type { Table } from '@mathesar/api/rpc/tables';
  import { currentDbAbstractTypes } from '@mathesar/stores/abstract-types';
  import { Meta, TabularData } from '@mathesar/stores/table-data';
  import RecordSummaryConfig from '@mathesar/systems/table-view/table-inspector/record-summary/RecordSummaryConfig.svelte';
  import Pagination from '@mathesar/utils/Pagination';

  export let table: Table;

  $: abstractTypesMap = $currentDbAbstractTypes.data;
  $: tabularData = new TabularData({
    id: table.oid,
    abstractTypesMap,
    meta: new Meta({ pagination: new Pagination({ size: 1 }) }),
    table,
  });
</script>

<RecordSummaryConfig {table} {tabularData} />
