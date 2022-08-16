<!-- 
  TODO: Implement the loader while renaming
  when implementing rename functionality
  using table inspector
 -->
<script lang="ts">
  import type { ProcessedColumn } from '@mathesar/stores/table-data/types';
  import TableColumnName from '@mathesar/components/TableColumnName.svelte';
  // TODO: Check if this component should be moved to
  // some common place??
  import CellBackground from '../../row/CellBackground.svelte';

  export let processedColumn: ProcessedColumn;
  export let isSelected = false;
</script>

<CellBackground when={isSelected} color="var(--cell-bg-color-row-selected)" />
<TableColumnName on:click column={processedColumn} />

<style global lang="scss">
  @import 'HeaderCell.scss';
</style>
