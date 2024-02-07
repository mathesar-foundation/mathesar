<script lang="ts">
  import { ID_ROW_CONTROL_COLUMN } from '@mathesar/stores/table-data';
  import { getSheetCellStyle } from './sheetCellUtils';

  const style = getSheetCellStyle(ID_ROW_CONTROL_COLUMN);

  export let rowSelectionId: string;
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
  }
</style>
