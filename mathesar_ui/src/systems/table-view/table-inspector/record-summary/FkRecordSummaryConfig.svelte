<script lang="ts">
  import type { Table } from '@mathesar/models/Table';
  import { abstractTypesMap } from '@mathesar/stores/abstract-types';
  import { Meta, TabularData } from '@mathesar/stores/table-data';
  import RecordSummaryConfig from '@mathesar/systems/table-view/table-inspector/record-summary/RecordSummaryConfig.svelte';
  import Pagination from '@mathesar/utils/Pagination';

  // eslint-disable-next-line svelte/valid-compile
  export let table: Table;

  // $: tabularData = new TabularData({
  //   database: table.schema.database,
  //   table,
  //   meta: new Meta({ pagination: new Pagination({ size: 1 }) }),
  // });
</script>

<!-- <RecordSummaryConfig {tabularData} /> -->
TODO
