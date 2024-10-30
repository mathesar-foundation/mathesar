<script lang="ts">
  import type { ResultValue } from '@mathesar/api/rpc/records';
  import type { Table } from '@mathesar/models/Table';
  import { TableStructure } from '@mathesar/stores/table-data';
  import RecordSummaryConfig from '@mathesar/systems/table-view/table-inspector/record-summary/RecordSummaryConfig.svelte';

  export let linkedTable: Table;
  export let previewRecordId: ResultValue | undefined;

  $: ({ database } = linkedTable.schema);
  $: structure = new TableStructure({ database, table: linkedTable });
  $: ({ processedColumns, isLoading } = structure);
</script>

<RecordSummaryConfig
  {database}
  table={linkedTable}
  processedColumns={$processedColumns}
  isLoading={$isLoading}
  {previewRecordId}
/>
