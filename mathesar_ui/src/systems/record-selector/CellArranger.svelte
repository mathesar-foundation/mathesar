<script lang="ts">
  // TODO: Remove route dependency in systems
  import type { ProcessedTableColumnMap } from '@mathesar/routes/schema-home/routes/datascape/table-view/utils';
  import { Display, getCellStyle } from '@mathesar/stores/table-data';

  export let display: Display;
  export let processedTableColumnsMap: ProcessedTableColumnMap;

  $: ({ columnPlacements } = display);
</script>

{#each [...processedTableColumnsMap] as [columnId, processedColumn] (columnId)}
  <slot {processedColumn} style={getCellStyle($columnPlacements, columnId)} />
{/each}
