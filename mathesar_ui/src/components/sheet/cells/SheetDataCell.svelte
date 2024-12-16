<script lang="ts">
  import CellBackground from '@mathesar/components/CellBackground.svelte';

  import type SheetSelection from '../selection/SheetSelection';

  import { getSheetCellStyle } from './sheetCellUtils';

  type SheetColumnIdentifierKey = $$Generic;

  export let columnIdentifierKey: SheetColumnIdentifierKey;
  export let cellSelectionId: string | undefined = undefined;
  export let selection: SheetSelection | undefined = undefined;

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
  data-cell-selection-id={cellSelectionId}
  data-cell-active={isActive ? '' : undefined}
  data-cell-selected={isSelected ? '' : undefined}
  style={$style}
>
  {#if hasSelectionBackground}
    <CellBackground color="rgba(14, 101, 235, 0.1)" when={isSelected} />
  {/if}
  <slot {isActive} {isSelected} />
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
    /* border-color: transparent; */
    min-height: 100%;
    height: auto;
  }
</style>
