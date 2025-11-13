<script lang="ts">
  import { getSheetCellStyle } from './sheetCellUtils';

  export let columnIdentifierKey: string;

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
    border-right: 1px solid var(--color-border-header);
    border-bottom: none;
    font-size: var(--sm1);
    overflow: hidden;
    color: var(--color-fg-base);
  }
</style>
