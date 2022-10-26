<script lang="ts">
  import CellFabric from '@mathesar/components/cell-fabric/CellFabric.svelte';
  import {
    rowHasSavedRecord,
    type ProcessedColumn,
    type RecordRow,
  } from '@mathesar/stores/table-data';
  import type RecordSummaryStore from '@mathesar/stores/table-data/record-summaries/RecordSummaryStore';
  import Cell from './RecordSelectorCellWrapper.svelte';

  export let row: RecordRow;
  export let processedColumn: ProcessedColumn;
  export let recordSummaries: RecordSummaryStore;

  $: ({ column } = processedColumn);
  $: value = row?.record?.[column.id];

  $: recordSummary = $recordSummaries
    .get(String(column.id))
    ?.get(String(value));
</script>

<Cell rowType="dataRow" columnType="dataColumn">
  <CellFabric
    columnFabric={processedColumn}
    {value}
    {recordSummary}
    disabled
    showAsSkeleton={!rowHasSavedRecord(row)}
  />
</Cell>
