<script lang="ts">
  import CellInspector from '@mathesar/components/inspector/cell/CellInspector.svelte';
  import { getTabularDataStoreFromContext } from '@mathesar/stores/table-data';

  import { getSelectedCellData } from './cellModeUtils';

  const tabularData = getTabularDataStoreFromContext();

  $: ({ selection, recordsData, processedColumns } = $tabularData);
  $: ({ recordSummaries, selectableRowsMap } = recordsData);
  $: selectedCellData = getSelectedCellData(
    $selection,
    $selectableRowsMap,
    $processedColumns,
    $recordSummaries,
  );
</script>

<CellInspector {selectedCellData} />
