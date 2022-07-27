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

  export let columnWidths: ImmutableMap<SheetColumnIdentifierKey, number> =
    new ImmutableMap();

  $: ({ columnStyleMap, rowWidth } = calculateColumnStyleMapAndRowWidth(
    columns,
    getColumnIdentifier,
    columnWidths,
  ));

  function setColumnWidth(
    columnIdentifierKey: SheetColumnIdentifierKey,
    width: number,
  ): void {
    columnWidths = columnWidths.with(columnIdentifierKey, width);
  }

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

  function resetColumnWidth(
    columnIdentifierKey: SheetColumnIdentifierKey,
  ): void {
    columnWidths = columnWidths.without(columnIdentifierKey);
  }

  const api = {
    setColumnWidth,
    getColumnWidth,
    resetColumnWidth,
  };

  // Creating stores of properties to make them reactive in context

  const stores = {
    columnStyleMap: writable(columnStyleMap),
    rowWidth: writable(rowWidth),
  };

  $: stores.rowWidth.set(rowWidth);
  $: stores.columnStyleMap.set(columnStyleMap);

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
