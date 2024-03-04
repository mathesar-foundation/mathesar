<script lang="ts">
  import { writable } from 'svelte/store';

  import { ImmutableMap } from '@mathesar-component-library/types';
  import type { ClipboardHandler } from '@mathesar/stores/clipboard';
  import { getClipboardHandlerStoreFromContext } from '@mathesar/stores/clipboard';
  import {
    DEFAULT_COLUMN_WIDTH,
    calculateColumnStyleMapAndRowWidth,
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

  export let getColumnIdentifier: (
    c: SheetColumnType,
  ) => SheetColumnIdentifierKey;

  export let scrollOffset = 0;

  export let horizontalScrollOffset = 0;
  export let paddingRight = hasPaddingRight ? 100 : 0;

  export let columnWidths: ImmutableMap<SheetColumnIdentifierKey, number> =
    new ImmutableMap();

  $: ({ columnStyleMap, rowWidth } = calculateColumnStyleMapAndRowWidth(
    columns,
    getColumnIdentifier,
    columnWidths,
    paddingRight,
  ));

  function getColumnWidth(
    columnIdentifierKey: SheetColumnIdentifierKey,
  ): number {
    const customWidth = columnWidths.get(columnIdentifierKey);
    if (typeof customWidth !== 'undefined') {
      return customWidth;
    }
    const isColumnValid = columns.some(
      (entry) => getColumnIdentifier(entry) === columnIdentifierKey,
    );
    if (isColumnValid) {
      return DEFAULT_COLUMN_WIDTH;
    }
    return 0;
  }

  const api = {
    getColumnWidth,
    setColumnWidth: (key: SheetColumnIdentifierKey, width: number) => {
      columnWidths = columnWidths.with(key, width);
    },
    resetColumnWidth: (key: SheetColumnIdentifierKey) => {
      columnWidths = columnWidths.without(key);
    },
    setHorizontalScrollOffset: (offset: number) => {
      horizontalScrollOffset = offset;
    },
    setScrollOffset: (offset: number) => {
      scrollOffset = offset;
    },
  };

  const stores = {
    columnStyleMap: writable(columnStyleMap),
    rowWidth: writable(rowWidth),
    horizontalScrollOffset: writable(horizontalScrollOffset),
    scrollOffset: writable(scrollOffset),
    paddingRight: writable(paddingRight),
  };

  // Setting these values in stores for reactivity in context
  $: stores.rowWidth.set(rowWidth);
  $: stores.columnStyleMap.set(columnStyleMap);
  $: stores.horizontalScrollOffset.set(horizontalScrollOffset);
  $: stores.scrollOffset.set(scrollOffset);
  $: stores.paddingRight.set(paddingRight);

  setSheetContext({ stores, api });

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
</script>

<div
  class="sheet"
  class:has-border={hasBorder}
  class:uses-virtual-list={usesVirtualList}
  class:set-to-row-width={restrictWidthToRowWidth}
  {style}
  on:click
  on:focusin={enableClipboard}
  on:focusout={disableClipboard}
>
  {#if columns.length}
    <slot />
  {/if}
</div>

<style lang="scss">
  .sheet {
    display: flex;
    flex-direction: column;
    isolation: isolate;
    --z-index__sheet__column-resizer: 2;
    --z-index__sheet__active-cell: 3;
    --z-index__sheet__row-header-cell: 4;
    --z-index__sheet__group-header: 5;
    --z-index__sheet__new-record-message: 6;
    --z-index__sheet__horizontal-scrollbar: 7;
    --z-index__sheet__vertical-scrollbar: 8;

    --virtual-list-horizontal-scrollbar-z-index: var(
      --z-index__sheet__horizontal-scrollbar
    );
    --virtual-list-vertical-scrollbar-z-index: var(
      --z-index__sheet__vertical-scrollbar
    );

    &.has-border {
      border: 1px solid var(--color-gray-medium);
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

    :global([data-sheet-element='cell']) {
      position: absolute;
      display: flex;
      align-items: center;
      border-bottom: var(--cell-border-horizontal);
      border-right: var(--cell-border-vertical);
      left: 0;
      top: 0;
      height: 100%;
    }

    :global([data-sheet-element='cell'][data-cell-static='true']) {
      position: sticky;
      z-index: var(--z-index__sheet__row-header-cell);
    }

    :global([data-sheet-element='cell'][data-cell-control='true']) {
      font-size: var(--text-size-x-small);
      padding: 0 1.5rem;
      justify-content: center;
      color: var(--color-text-muted);
      display: inline-flex;
      align-items: center;
      height: 100%;
    }

    :global([data-sheet-element='row']) {
      transition: all 0.2s cubic-bezier(0, 0, 0.2, 1);
    }
  }
</style>
