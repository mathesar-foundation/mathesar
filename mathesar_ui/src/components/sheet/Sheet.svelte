<script lang="ts">
  import { onMount, tick } from 'svelte';
  import { writable } from 'svelte/store';

  import {
    type ClipboardHandler,
    getClipboardHandlerStoreFromContext,
  } from '@mathesar/stores/clipboard';
  import { getModifierKeyCombo } from '@mathesar/utils/pointerUtils';
  import { ImmutableMap } from '@mathesar-component-library/types';

  import {
    type SheetCellDetails,
    beginSelection,
    findContainingSheetCell,
  } from './selection';
  import type SheetSelectionStore from './selection/SheetSelectionStore';
  import {
    calculateColumnStyleMapAndRowWidth,
    focusActiveCell,
    normalizeColumnWidth,
    setSheetContext,
  } from './utils';

  type SheetColumnType = $$Generic;
  type SheetColumnIdentifierKey = $$Generic;

  const clipboardHandlerStore = getClipboardHandlerStoreFromContext();

  export let columns: SheetColumnType[];
  export let usesVirtualList = false;
  export let restrictWidthToRowWidth = false;
  export let hasBorder = false;
  export let hasPaddingRight = false;
  export let clipboardHandler: ClipboardHandler | undefined = undefined;
  export let selection: SheetSelectionStore | undefined = undefined;
  export let onCellSelectionStart: (c: SheetCellDetails) => void = () => {};

  export let getColumnIdentifier: (
    c: SheetColumnType,
  ) => SheetColumnIdentifierKey;

  export let scrollOffset = 0;

  export let horizontalScrollOffset = 0;
  export let paddingRight = hasPaddingRight ? 100 : 0;

  export let columnWidths: ImmutableMap<SheetColumnIdentifierKey, number> =
    new ImmutableMap();

  export let sheetElement: HTMLElement | undefined = undefined;

  $: ({ columnStyleMap, rowWidth } = calculateColumnStyleMapAndRowWidth(
    columns,
    getColumnIdentifier,
    columnWidths,
    paddingRight,
  ));

  const selectionInProgress = writable(false);
  const stores = {
    columnStyleMap: writable(columnStyleMap),
    rowWidth: writable(rowWidth),
    horizontalScrollOffset: writable(horizontalScrollOffset),
    scrollOffset: writable(scrollOffset),
    paddingRight: writable(paddingRight),
    selectionInProgress,
  };

  // Setting these values in stores for reactivity in context
  $: stores.rowWidth.set(rowWidth);
  $: stores.columnStyleMap.set(columnStyleMap);
  $: stores.horizontalScrollOffset.set(horizontalScrollOffset);
  $: stores.scrollOffset.set(scrollOffset);
  $: stores.paddingRight.set(paddingRight);

  setSheetContext({
    stores,
    api: {
      getColumnWidth: (id) => normalizeColumnWidth(columnWidths.get(id)),
      setColumnWidth: (key, width) => {
        columnWidths = columnWidths.with(key, width);
      },
      resetColumnWidth: (key) => {
        columnWidths = columnWidths.without(key);
      },
      setHorizontalScrollOffset: (offset) => {
        horizontalScrollOffset = offset;
      },
      setScrollOffset: (offset) => {
        scrollOffset = offset;
      },
    },
  });

  $: style = restrictWidthToRowWidth ? `width:${rowWidth}px;` : undefined;

  // What is this enable/disable clipboard stuff about, and why is it here?
  //
  // When a cell within this sheet is focused, we tell the global
  // `clipboardHandlerStore` that we want the user's copy/paste keyboard
  // shortcuts to operate on the cells in this sheet. Then, when a cell is
  // blurred, we reset that store to `undefined`, removing that custom behavior.
  // If the user changes focus from one cell within this sheet to another, the
  // DOM will fire the `focusout` event before firing the `focusin` event. That
  // leads to a momentary period where the global `clipboardHandlerStore` is set
  // to `undefined`, but that seems to be okay.
  //
  // Some pages may even have multiple sheets (e.g. Record Page), so it's
  // important that the global clipboard handler store follows the focus from
  // one sheet to another.

  function enableClipboard() {
    clipboardHandlerStore?.set(clipboardHandler);
  }

  function disableClipboard() {
    clipboardHandlerStore?.set(undefined);
  }

  function handleMouseDown(e: MouseEvent) {
    if (!selection) return;
    if (!sheetElement) return;

    const target = e.target as HTMLElement;
    const targetCell = findContainingSheetCell(target);
    if (!targetCell) return;

    const startingCell: SheetCellDetails | undefined = (() => {
      const modifierKeyCombo = getModifierKeyCombo(e);
      if (modifierKeyCombo === '') return targetCell;
      if (modifierKeyCombo === 'Shift') {
        if (!$selection) return undefined;
        const { activeCellId } = $selection;
        if (!activeCellId) return undefined;
        return { type: 'data-cell', cellId: activeCellId };
      }
      return undefined;
    })();
    if (!startingCell) return;

    // If we're selecting cells, then we need to prevent this mouse event from
    // inadvertently setting clicked elements to become focused. If they get
    // focused then there can be race conditions which (sometimes) prevent the
    // active cell within the selection from becoming focused. For example, this
    // problem can happen when clicking on column header cells to select all
    // cells in the column.
    e.preventDefault();

    beginSelection({
      selection,
      sheetElement,
      startingCell,
      targetCell,
      selectionInProgress,
    });

    if (startingCell === targetCell) {
      onCellSelectionStart(targetCell);
    }
  }

  onMount(() => {
    selection?.on('focus', async () => {
      if (!sheetElement) return;
      await tick();
      focusActiveCell(sheetElement);
    });

    return () => {
      // Need to disable clipboard when the sheet is unmounted so that the user
      // can copy text in the page without the clipboard handler interfering.
      // https://github.com/mathesar-foundation/mathesar/issues/4289
      disableClipboard();
    };
  });
</script>

<div
  class="sheet"
  class:has-border={hasBorder}
  class:uses-virtual-list={usesVirtualList}
  class:set-to-row-width={restrictWidthToRowWidth}
  class:selection-in-progress={$selectionInProgress}
  {style}
  on:mousedown={handleMouseDown}
  on:focusin={enableClipboard}
  on:focusout={disableClipboard}
  bind:this={sheetElement}
>
  {#if columns.length}
    <slot />
  {/if}
</div>

<style lang="scss">
  .sheet {
    border: 1px solid var(--border-color);
    background-color: var(--sheet-background);
    margin: 0;
    border-radius: 0.5rem;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    isolation: isolate;
    --z-index__sheet__column-resizer: 2;
    --z-index__sheet__active-cell: 3;
    --z-index__sheet__row-header-cell: 4;
    --z-index__sheet__positionable-cell: 5;
    --z-index__sheet__column-header-cell: 6;
    --z-index__sheet__origin-cell: 7;
    --z-index__sheet__horizontal-scrollbar: 8;
    --z-index__sheet__vertical-scrollbar: 9;

    --virtual-list-horizontal-scrollbar-z-index: var(
      --z-index__sheet__horizontal-scrollbar
    );
    --virtual-list-vertical-scrollbar-z-index: var(
      --z-index__sheet__vertical-scrollbar
    );

    &.has-border {
      border: 1px solid var(--border-color);
    }

    &.uses-virtual-list {
      overflow: hidden;
      position: absolute;
      left: 0;
      right: 0;
      top: 0;
      bottom: 0;
    }

    &.set-to-row-width {
      min-width: 100%;
    }

    &.selection-in-progress :global(*) {
      cursor: default;
    }
  }
</style>
