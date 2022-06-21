<script lang="ts">
  import type { ProcessedTableColumnMap } from '@mathesar/sections/table-view/utils';
  import { Display, getCellStyle } from '@mathesar/stores/table-data';

  export let display: Display;
  export let processedTableColumnsMap: ProcessedTableColumnMap;

  $: ({ columnPlacements } = display);
</script>

{#each [...processedTableColumnsMap] as [columnId, processedColumn] (columnId)}
  <slot {processedColumn} style={getCellStyle($columnPlacements, columnId)} />
{/each}
