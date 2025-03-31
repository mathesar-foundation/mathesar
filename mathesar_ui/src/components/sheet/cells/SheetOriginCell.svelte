<script lang="ts">
  import { getSheetCellStyle } from './sheetCellUtils';

  type ColumnIdentifierKey = $$Generic;

  export let columnIdentifierKey: ColumnIdentifierKey;

  $: style = getSheetCellStyle(columnIdentifierKey);
</script>

<div data-sheet-element="origin-cell" style={$style}>
  <slot />
</div>

<style>
  [data-sheet-element='origin-cell'] {
    position: sticky;
    left: 0;
    top: 0;
    z-index: var(--z-index__sheet__origin-cell);
    height: 100%;
    border-right: var(--cell-border-vertical);
    border-bottom: none;
    background: var(--cell-bg-color-header);
  }
</style>
