<script lang="ts">
  // TODO: Remove route dependency in systems
  import {
    Display,
    getCellStyle,
    getTabularDataStoreFromContext,
  } from '@mathesar/stores/table-data';

  const tabularData = getTabularDataStoreFromContext();

  export let display: Display;

  $: ({ columnPlacements } = display);
  $: ({ processedColumns } = $tabularData);
</script>

{#each [...$processedColumns] as [columnId, processedColumn] (columnId)}
  <slot {processedColumn} style={getCellStyle($columnPlacements, columnId)} />
{/each}
