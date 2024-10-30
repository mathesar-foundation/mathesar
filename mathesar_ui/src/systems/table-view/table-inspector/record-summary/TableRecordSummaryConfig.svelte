<script lang="ts">
  import type { TabularData } from '@mathesar/stores/table-data';
  import RecordSummaryConfig from '@mathesar/systems/table-view/table-inspector/record-summary/RecordSummaryConfig.svelte';

  import { getTableRecordId } from './utils';

  export let tabularData: TabularData;

  $: ({ table, processedColumns, database, recordsData, selection } =
    tabularData);
  $: ({ selectableRowsMap } = recordsData);
  $: previewRecordId = getTableRecordId({
    processedColumns: $processedColumns,
    selection: $selection,
    selectableRowsMap: $selectableRowsMap,
  });
</script>

<RecordSummaryConfig
  {database}
  {table}
  processedColumns={$processedColumns}
  {previewRecordId}
/>
