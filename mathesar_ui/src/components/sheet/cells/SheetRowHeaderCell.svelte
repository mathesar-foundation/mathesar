<script lang="ts">
  import { getSheetCellStyle } from './sheetCellUtils';

  export let rowSelectionId: string;
  export let columnIdentifierKey: string;
  export let isWithinPlaceholderRow = false;
  export let onMouseDown: ((e: MouseEvent) => void) | undefined = undefined;

  $: style = getSheetCellStyle(columnIdentifierKey);
</script>

<div
  data-sheet-element="row-header-cell"
  data-sheet-row-type={isWithinPlaceholderRow ? 'placeholder' : 'data'}
  data-row-selection-id={rowSelectionId}
  style={$style}
  on:mousedown={onMouseDown}
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
    border-bottom: 1px solid var(--color-border-header);
    border-right: 1px solid var(--color-border-header);
    font-size: var(--sm2);
    padding: 0 1.5rem;
    color: var(--color-fg-base-muted);

    &[data-sheet-row-type='placeholder'] {
      cursor: pointer;
    }
  }
</style>
