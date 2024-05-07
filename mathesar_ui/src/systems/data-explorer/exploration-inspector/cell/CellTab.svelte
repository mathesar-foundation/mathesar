<script lang="ts">
  import CellInspector from '@mathesar/components/inspector/cell/CellInspector.svelte';

  import type QueryRunner from '../../QueryRunner';

  import { getSelectedCellData } from './cellTabUtils';

  export let queryHandler: QueryRunner;

  $: ({ selection, processedColumns, rowsData } = queryHandler);
  $: selectedCellData = getSelectedCellData(
    $selection,
    $rowsData.rows,
    $processedColumns,
  );
</script>

<CellInspector {selectedCellData} />
