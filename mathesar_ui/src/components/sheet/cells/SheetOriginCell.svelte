<script lang="ts">
  import { ID_ROW_CONTROL_COLUMN } from '@mathesar/stores/table-data';
  import { getSheetCellStyle } from './sheetCellUtils';

  const style = getSheetCellStyle(ID_ROW_CONTROL_COLUMN);
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
    background: var(--slate-100);
  }
</style>
