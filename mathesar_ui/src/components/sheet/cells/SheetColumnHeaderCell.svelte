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
    border-top: 1px solid var(--border-header);
    border-left: 1px solid var(--border-header);
    border-bottom: none;
    font-size: 1rem;
    font-weight: var(font-weight-bold);
    overflow: hidden;
    color: var(--text-primary);
  }
</style>
