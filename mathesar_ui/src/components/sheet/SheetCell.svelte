<script lang="ts">
  import type { SheetCellType } from './types';
  import { getSheetContext } from './utils';

  type SheetColumnIdentifierKey = $$Generic;

  const { stores } = getSheetContext();
  const { columnStyleMap } = stores;

  export let type: SheetCellType;
  export let columnIdentifierKey: SheetColumnIdentifierKey;
  export let isActive = false;
  export let isSelected = false;
  export let lightText = false;

  $: styleMap = $columnStyleMap.get(columnIdentifierKey);
</script>

<div
  class="sheet-cell"
  data-sheet-element={type}
  style={styleMap?.styleString}
  class:is-active={isActive}
  class:is-selected={isSelected}
  class:light-text={lightText}
>
  <slot />
</div>

<style lang="scss">
  .sheet-cell {
    &[data-sheet-element='origin-cell'],
    &[data-sheet-element='column-header-cell'],
    &[data-sheet-element='new-column-cell'],
    &[data-sheet-element='row-header-cell'],
    &[data-sheet-element='data-cell'] {
      position: absolute;
      display: flex;
      align-items: center;
      border-bottom: var(--cell-border-horizontal);
      border-right: var(--cell-border-vertical);
      left: 0;
      top: 0;
      height: 100%;
    }

    &[data-sheet-element='column-header-cell'],
    &[data-sheet-element='origin-cell'],
    &[data-sheet-element='new-column-cell'] {
      border-bottom: none;
      background: var(--slate-100);
      font-size: var(--text-size-small);
      font-weight: 500;
      overflow: hidden;
    }

    &[data-sheet-element='origin-cell'] {
      position: sticky;
      z-index: var(--z-index__sheet__origin-cell);
    }

    &[data-sheet-element='column-header-cell'] {
      z-index: var(--z-index__sheet__column-header-cell);
    }

    &[data-sheet-element='positionable-cell'] {
      z-index: var(--z-index__sheet__positionable-cell);
    }

    &[data-sheet-element='row-header-cell'] {
      position: sticky;
      z-index: var(--z-index__sheet__row-header-cell);
      font-size: var(--text-size-x-small);
      padding: 0 1.5rem;
      justify-content: center;
      color: var(--color-text-muted);
      display: inline-flex;
      align-items: center;
      height: 100%;
    }

    &.is-active {
      z-index: var(--z-index__sheet__active-cell);
      border-color: transparent;
      min-height: 100%;
      /* TODO: why do we need !important here? Please remove or document */
      height: auto !important;
    }

    &.light-text {
      color: var(--cell-text-color-processing);
    }

    &[data-sheet-element='data-cell'] {
      user-select: none;
      -webkit-user-select: none; /* Safari */
      background: var(--cell-bg-color-base);
    }

    &[data-sheet-element='new-column-cell'] {
      padding: 0 0.2rem;
    }
  }
</style>
