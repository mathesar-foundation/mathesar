<script lang="ts">
  import { writable } from 'svelte/store';
  import { ImmutableMap } from '@mathesar-component-library/types';
  import {
    setSheetContext,
    calculateColumnStyleMapAndRowWidth,
    DEFAULT_COLUMN_WIDTH,
  } from './utils';

  type SheetColumnType = $$Generic;
  type SheetColumnIdentifierKey = $$Generic;

  export let columns: SheetColumnType[];

  export let getColumnIdentifier: (
    c: SheetColumnType,
  ) => SheetColumnIdentifierKey;

  export let scrollOffset = 0;

  export let horizontalScrollOffset = 0;

  export let columnWidths: ImmutableMap<SheetColumnIdentifierKey, number> =
    new ImmutableMap();

  $: ({ columnStyleMap, rowWidth } = calculateColumnStyleMapAndRowWidth(
    columns,
    getColumnIdentifier,
    columnWidths,
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
  };

  // Setting these values in stores for reactivity in context
  $: stores.rowWidth.set(rowWidth);
  $: stores.columnStyleMap.set(columnStyleMap);
  $: stores.horizontalScrollOffset.set(horizontalScrollOffset);
  $: stores.scrollOffset.set(scrollOffset);

  setSheetContext({ stores, api });
</script>

<div class="sheet">
  {#if columns.length}
    <slot />
  {/if}
</div>

<style lang="scss">
  .sheet {
    overflow: hidden;
    position: absolute;
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;
    display: flex;
    flex-direction: column;

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
      z-index: 5;
    }

    :global([data-sheet-element='row']) {
      transition: all 0.2s cubic-bezier(0, 0, 0.2, 1);
    }
  }
</style>
