<script lang="ts">
  import type { Writable } from 'svelte/store';

  import CellFabric from '@mathesar/components/cell-fabric/CellFabric.svelte';
  import {
    type ProcessedColumn,
    type RecordRow,
    type SearchFuzzy,
    rowHasSavedRecord,
  } from '@mathesar/stores/table-data';
  import type RecordSummaryStore from '@mathesar/stores/table-data/record-summaries/RecordSummaryStore';

  import Cell from './RecordSelectorCellWrapper.svelte';

  export let row: RecordRow;
  export let processedColumn: ProcessedColumn;
  export let linkedRecordSummaries: RecordSummaryStore;
  export let searchFuzzy: Writable<SearchFuzzy>;
  export let isLoading = false;

  $: ({ column } = processedColumn);
  $: searchValue = $searchFuzzy.get(column.id);
  $: value = row?.record?.[column.id];
  $: recordSummary = $linkedRecordSummaries
    .get(String(column.id))
    ?.get(String(value));
</script>

<Cell rowType="dataRow" columnType="dataColumn">
  <CellFabric
    columnFabric={processedColumn}
    {value}
    {recordSummary}
    disabled
    showAsSkeleton={!rowHasSavedRecord(row) || isLoading}
    {searchValue}
    showTruncationPopover
  />
</Cell>
