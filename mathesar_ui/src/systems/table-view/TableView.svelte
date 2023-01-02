<script lang="ts">
  import { ImmutableMap } from '@mathesar-component-library';
  import { Sheet } from '@mathesar/components/sheet';
  import {
    getTabularDataStoreFromContext,
    ID_ADD_NEW_COLUMN,
    ID_ROW_CONTROL_COLUMN,
    type TabularDataSelection,
  } from '@mathesar/stores/table-data';
  import { rowHeaderWidthPx } from '@mathesar/geometry';
  import { orderProcessedColumns } from '@mathesar/utils/tables';
  import type { TableEntry } from '@mathesar/api/types/tables';
  import Body from './Body.svelte';
  import Header from './header/Header.svelte';
  import StatusPane from './StatusPane.svelte';
  import TableInspector from './table-inspector/TableInspector.svelte';

  const tabularData = getTabularDataStoreFromContext();

  export let context: 'page' | 'widget' = 'page';
  export let table: TableEntry;

  $: usesVirtualList = context === 'page';
  $: allowsDdlOperations = context === 'page';
  $: sheetHasBorder = context === 'widget';
  $: ({ processedColumns, display, isLoading, selection } = $tabularData);
  $: ({ activeCell } = selection);
  $: ({ horizontalScrollOffset, scrollOffset, isTableInspectorVisible } =
    display);
  $: ({ settings } = table);
  $: ({ column_order: columnOrder } = settings);
  $: hasNewColumnButton = allowsDdlOperations;
  /**
   * These are separate variables for readability and also to keep the door open
   * to more easily displaying the Table Inspector even if DDL operations are
   * not supported.
   */
  $: supportsTableInspector = allowsDdlOperations;
  $: sheetColumns = (() => {
    const orderedProcessedColumns = orderProcessedColumns($processedColumns, columnOrder);
    const columns = [
      { column: { id: ID_ROW_CONTROL_COLUMN, name: 'ROW_CONTROL' } },
      ...orderedProcessedColumns.values(),
    ];
    if (hasNewColumnButton) {
      columns.push({ column: { id: ID_ADD_NEW_COLUMN, name: 'ADD_NEW' } });
    }
    return columns;
  })();

  const columnWidths = new ImmutableMap([
    [ID_ROW_CONTROL_COLUMN, rowHeaderWidthPx],
    [ID_ADD_NEW_COLUMN, 32],
  ]);
  $: showTableInspector =
    $isTableInspectorVisible && !$isLoading && supportsTableInspector;

  function selectAndActivateFirstCellOnTableLoad(
    _isLoading: boolean,
    _selection: TabularDataSelection,
  ) {
    if (!_isLoading) {
      _selection.selectAndActivateFirstCellIfExists();
    }
  }

  function checkAndReinstateFocusOnActiveCell(e: Event) {
    const target = e.target as HTMLElement;
    if (!target.closest('[data-sheet-element="cell"')) {
      if ($activeCell) {
        selection.focusCell(
          { rowIndex: $activeCell.rowIndex },
          { id: Number($activeCell.columnId) },
        );
      }
    }
  }

  $: void selectAndActivateFirstCellOnTableLoad($isLoading, selection);
</script>

<div class="table-view">
  <div class="table-inspector-view">
    <div class="sheet-area" on:click={checkAndReinstateFocusOnActiveCell}>
      {#if $processedColumns.size}
        <Sheet
          columns={sheetColumns}
          getColumnIdentifier={(entry) => entry.column.id}
          {usesVirtualList}
          {columnWidths}
          hasBorder={sheetHasBorder}
          restrictWidthToRowWidth={!usesVirtualList}
          bind:horizontalScrollOffset={$horizontalScrollOffset}
          bind:scrollOffset={$scrollOffset}
        >
          <Header {hasNewColumnButton} {columnOrder} {table} />
          <Body {usesVirtualList} />
        </Sheet>
      {/if}
    </div>
    {#if showTableInspector}
      <TableInspector />
    {/if}
  </div>
  <StatusPane {context} />
</div>

<style>
  .table-view {
    display: grid;
    grid-template: 1fr auto / 1fr;
    height: 100%;
    overflow: hidden;
  }
  .table-inspector-view {
    display: flex;
    flex-direction: row;
    overflow: hidden;
  }
  .sheet-area {
    position: relative;
    overflow-x: auto;
    flex: 1;
  }
</style>
