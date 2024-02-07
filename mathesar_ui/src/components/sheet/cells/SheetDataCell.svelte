<script lang="ts">
  import { getSheetCellStyle } from './sheetCellUtils';

  type SheetColumnIdentifierKey = $$Generic;

  export let columnIdentifierKey: SheetColumnIdentifierKey;
  export let cellSelectionId: string | undefined = undefined;
  export let isActive = false;
  export let isSelected = false;

  $: style = getSheetCellStyle(columnIdentifierKey);
</script>

<div
  data-sheet-element="data-cell"
  data-cell-selection-id={cellSelectionId}
  data-cell-active={isActive ? '' : undefined}
  data-cell-selected={isSelected ? '' : undefined}
  style={$style}
>
  <slot />
</div>

<style>
  [data-sheet-element='data-cell'] {
    position: absolute;
    display: flex;
    align-items: center;
    border-bottom: var(--cell-border-horizontal);
    border-right: var(--cell-border-vertical);
    left: 0;
    top: 0;
    height: 100%;
    user-select: none;
    -webkit-user-select: none; /* Safari */
    background: var(--cell-bg-color-base);
  }

  [data-cell-active] {
    z-index: var(--z-index__sheet__active-cell);
    border-color: transparent;
    min-height: 100%;
    height: auto;
  }
</style>
