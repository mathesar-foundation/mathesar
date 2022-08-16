<!-- 
  TODO: Implement the loader while renaming
  when implementing rename functionality
  using table inspector
 -->
<script lang="ts">
  import type { ProcessedColumn } from '@mathesar/stores/table-data/types';
  import TableColumnName from '@mathesar/components/TableColumnName.svelte';

  export let processedColumn: ProcessedColumn;
</script>

<TableColumnName on:click column={processedColumn} />

<style global lang="scss">
  @import 'HeaderCell.scss';
</style>
