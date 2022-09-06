<!-- 
  TODO: Implement the loader while renaming
  when implementing rename functionality
  using table inspector
 -->
<script lang="ts">
  import { Button } from '@mathesar-component-library';
  import type { ProcessedColumn } from '@mathesar/stores/table-data/types';
  import TableColumnName from '@mathesar/components/TableColumnName.svelte';
  // TODO: Check if this component should be moved to
  // some common place??
  import CellBackground from '../../row/CellBackground.svelte';

  export let processedColumn: ProcessedColumn;
  export let isSelected = false;
</script>

<div>
  <CellBackground when={isSelected} color="var(--cell-bg-color-row-selected)" />
  <Button appearance="ghost" on:click>
    <TableColumnName column={processedColumn} />
  </Button>
</div>

<style lang="scss">
  div {
    width: 100%;

    :global(button.btn) {
      width: 100%;
      padding: 0.26rem 0.5rem;
      font-size: inherit;
    }
  }
</style>
