<script lang="ts">
  import CellInspector from '@mathesar/components/inspector/cell/CellInspector.svelte';
  import { getTabularDataStoreFromContext } from '@mathesar/stores/table-data';

  const tabularData = getTabularDataStoreFromContext();

  $: ({ selectedCellData } = $tabularData);
</script>

<CellInspector selectedCellData={$selectedCellData} />
