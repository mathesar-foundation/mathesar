<script lang="ts">
  import { getSheetCellStyle } from './sheetCellUtils';

  type SheetColumnIdentifierKey = $$Generic;

  export let columnIdentifierKey: SheetColumnIdentifierKey;

  const style = getSheetCellStyle(columnIdentifierKey);
</script>

<div
  data-sheet-element="column-header-cell"
  data-column-identifier={columnIdentifierKey}
  style={$style}
>
  <slot />
</div>

<style>
  [data-sheet-element='column-header-cell'] {
    position: absolute;
    z-index: var(--z-index__sheet__column-header-cell);
    display: flex;
    align-items: center;
    left: 0;
    top: 0;
    height: 100%;
    border-right: var(--cell-border-vertical);
    border-bottom: none;
    background: var(--slate-100);
    font-size: var(--text-size-small);
    font-weight: 500;
    overflow: hidden;
  }
</style>
