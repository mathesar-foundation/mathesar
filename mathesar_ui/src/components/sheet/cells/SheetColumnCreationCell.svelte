<script lang="ts">
  import { getSheetCellStyle } from './sheetCellUtils';

  type ColumnIdentifierKey = $$Generic;

  export let columnIdentifierKey: ColumnIdentifierKey;

  $: style = getSheetCellStyle(columnIdentifierKey);
</script>

<div data-sheet-element="new-column-cell" style={$style}>
  <slot />
</div>

<style>
  [data-sheet-element='new-column-cell'] {
    position: absolute;
    display: flex;
    align-items: center;
    border-bottom: var(--cell-border-horizontal);
    border-right: var(--cell-border-vertical);
    left: 0;
    top: 0;
    height: 100%;
    border-bottom: none;
    background: var(--cell-bg-color-header);
    font-size: var(--sm1);
    font-weight: 500;
    overflow: hidden;
    padding: 0;
  }
</style>
