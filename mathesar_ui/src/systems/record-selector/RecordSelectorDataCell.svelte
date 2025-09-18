<script lang="ts">
  import type { Writable } from 'svelte/store';

  import type { FileManifest } from '@mathesar/api/rpc/records';
  import CellFabric from '@mathesar/components/cell-fabric/CellFabric.svelte';
  import { parseFileReference } from '@mathesar/components/file-attachments/fileUtils';
  import type AssociatedCellData from '@mathesar/stores/AssociatedCellData';
  import {
    type ProcessedColumn,
    type RecordRow,
    type SearchFuzzy,
    isPersistedRecordRow,
  } from '@mathesar/stores/table-data';

  import Cell from './RecordSelectorCellWrapper.svelte';

  export let row: RecordRow;
  export let processedColumn: ProcessedColumn;
  export let linkedRecordSummaries: AssociatedCellData<string>;
  export let fileManifests: AssociatedCellData<FileManifest>;
  export let searchFuzzy: Writable<SearchFuzzy>;
  export let isLoading = false;

  $: ({ column } = processedColumn);
  $: searchValue = $searchFuzzy.get(column.id);
  $: value = row?.record?.[column.id];
  $: recordSummary = $linkedRecordSummaries
    .get(String(column.id))
    ?.get(String(value));
  $: fileManifest = (() => {
    if (!column.metadata?.file_backend) return undefined;
    const fileReference = parseFileReference(value);
    if (!fileReference) return undefined;
    return $fileManifests.get(String(column.id))?.get(fileReference.mash);
  })();
</script>

<Cell rowType="dataRow" columnType="dataColumn">
  <CellFabric
    columnFabric={processedColumn}
    {value}
    {recordSummary}
    {fileManifest}
    disabled
    showAsSkeleton={!isPersistedRecordRow(row) || isLoading}
    {searchValue}
    showTruncationPopover
  />
</Cell>
