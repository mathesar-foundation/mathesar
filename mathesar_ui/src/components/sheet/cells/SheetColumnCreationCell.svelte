<script lang="ts">
  import { ID_ADD_NEW_COLUMN } from '@mathesar/stores/table-data';
  import { getSheetCellStyle } from './sheetCellUtils';

  const style = getSheetCellStyle(ID_ADD_NEW_COLUMN);
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
    background: var(--slate-100);
    font-size: var(--text-size-small);
    font-weight: 500;
    overflow: hidden;
    padding: 0 0.2rem;
  }
</style>
