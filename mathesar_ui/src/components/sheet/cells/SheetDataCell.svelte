<script lang="ts">
  import { readable } from 'svelte/store';

  import CellBackground from '@mathesar/components/CellBackground.svelte';

  import { isSelectingCellRangeContext } from '../selection/isSelectingCellRangeContext';
  import type SheetSelection from '../selection/SheetSelection';

  import { getSheetCellStyle } from './sheetCellUtils';

  type SheetColumnIdentifierKey = $$Generic;

  const isSelectingCellRange =
    isSelectingCellRangeContext.get() ?? readable(false);

  export let columnIdentifierKey: SheetColumnIdentifierKey;
  export let cellSelectionId: string | undefined = undefined;
  export let selection: SheetSelection | undefined = undefined;
  export let isWithinPlaceholderRow = false;

  $: style = getSheetCellStyle(columnIdentifierKey);
  $: ({ isActive, isSelected, hasSelectionBackground } = (() => {
    if (!selection || !cellSelectionId) {
      return {
        isActive: false,
        isSelected: false,
        hasSelectionBackground: false,
      };
    }
    const selected = selection.cellIds.has(cellSelectionId);
    return {
      isActive: selection.activeCellId === cellSelectionId,
      isSelected: selected,
      hasSelectionBackground: selected && selection.cellIds.size > 1,
    };
  })());
</script>

<div
  data-sheet-element="data-cell"
  data-sheet-row-type={isWithinPlaceholderRow ? 'placeholder' : 'data'}
  data-cell-selection-id={cellSelectionId}
  data-cell-active={isActive ? '' : undefined}
  data-cell-selected={isSelected ? '' : undefined}
  style={$style}
>
  {#if hasSelectionBackground}
    <CellBackground color="var(--color-selection-subtle-2)" when={isSelected} />
  {/if}
  {#if isActive}
    <div
      class="active-indicator"
      class:is-selecting-cell-range={$isSelectingCellRange}
    />
  {/if}
  <slot {isActive} {isSelected} />
</div>

<style lang="scss">
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
    line-height: 1.2;
  }

  [data-cell-active] {
    z-index: var(--z-index__sheet__active-cell);
    min-height: 100%;
    height: auto;
  }

  :global(
      [data-sheet-element='data-cell']:has(.is-edit-mode) .active-indicator
    ) {
    // Hide the active indicator when the cell is in edit mode
    display: none;
  }

  .active-indicator {
    --size: 2px;
    --color: var(--color-border-raised-3);
    position: absolute;
    inset: calc((-1 * var(--size)));
    border-radius: var(--size);
    border-width: var(--size);
    border-style: solid;
    border-color: var(--color);
    pointer-events: none;
  }

  .active-indicator.is-selecting-cell-range {
    border: none;
    background-image: repeating-linear-gradient(
        90deg,
        var(--color) 0 10px,
        transparent 10px 20px
      ),
      repeating-linear-gradient(
        180deg,
        var(--color) 0 10px,
        transparent 10px 20px
      ),
      repeating-linear-gradient(
        270deg,
        var(--color) 0 10px,
        transparent 10px 20px
      ),
      repeating-linear-gradient(
        0deg,
        var(--color) 0 10px,
        transparent 10px 20px
      );
    background-repeat: repeat-x, repeat-y, repeat-x, repeat-y;
    background-position:
      0 0,
      100% 0,
      0 100%,
      0 0;
    background-size:
      20px 3px,
      3px 20px,
      20px 3px,
      3px 20px;

    animation: dash 0.6s linear infinite;
  }

  [data-sheet-element='data-cell']:has([data-active-cell]:focus)
    .active-indicator {
    --size: 3px;
    --color: var(--color-selection-strong-2);
  }

  @keyframes dash {
    to {
      background-position:
        20px 0,
        100% 20px,
        -20px 100%,
        0 -20px;
    }
  }
</style>
