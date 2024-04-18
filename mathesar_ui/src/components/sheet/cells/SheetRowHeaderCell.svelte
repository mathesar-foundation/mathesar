<script lang="ts">
  import { getSheetCellStyle } from './sheetCellUtils';

  type ColumnIdentifierKey = $$Generic;

  export let rowSelectionId: string;
  export let columnIdentifierKey: ColumnIdentifierKey;

  $: style = getSheetCellStyle(columnIdentifierKey);
</script>

<div
  data-sheet-element="row-header-cell"
  data-row-selection-id={rowSelectionId}
  style={$style}
>
  <slot />
</div>

<style lang="scss">
  [data-sheet-element='row-header-cell'] {
    position: sticky;
    left: 0;
    top: 0;
    z-index: var(--z-index__sheet__row-header-cell);
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    border-bottom: var(--cell-border-horizontal);
    border-right: var(--cell-border-vertical);
    font-size: var(--text-size-x-small);
    padding: 0 1.5rem;
    color: var(--color-text-muted);
    cursor: default;
  }
</style>
