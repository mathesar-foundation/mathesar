<script lang="ts">
  import CellInspector from '@mathesar/components/inspector/cell/CellInspector.svelte';
  import { getTabularDataStoreFromContext } from '@mathesar/stores/table-data';

  import { getSelectedCellData } from './cellModeUtils';

  const tabularData = getTabularDataStoreFromContext();

  $: ({ selection, recordsData, processedColumns } = $tabularData);
  $: ({ linkedRecordSummaries, selectableRowsMap } = recordsData);
  $: selectedCellData = getSelectedCellData(
    $selection,
    $selectableRowsMap,
    $processedColumns,
    $linkedRecordSummaries,
  );
</script>

<CellInspector {selectedCellData} />
