<script lang="ts">
  import { get } from 'svelte/store';

  import type { TableEntry } from '@mathesar/api/rest/types/tables';
  import { Sheet } from '@mathesar/components/sheet';
  import { SheetClipboardHandler } from '@mathesar/components/sheet/SheetClipboardHandler';
  import { rowHeaderWidthPx } from '@mathesar/geometry';
  import { currentDatabase } from '@mathesar/stores/databases';
  import { currentSchema } from '@mathesar/stores/schemas';
  import {
    ID_ADD_NEW_COLUMN,
    ID_ROW_CONTROL_COLUMN,
    type TabularDataSelection,
    getTabularDataStoreFromContext,
  } from '@mathesar/stores/table-data';
  import { toast } from '@mathesar/stores/toast';
  import { getUserProfileStoreFromContext } from '@mathesar/stores/userProfile';
  import { orderProcessedColumns } from '@mathesar/utils/tables';
  import { ImmutableMap } from '@mathesar-component-library';

  import Body from './Body.svelte';
  import Header from './header/Header.svelte';
  import StatusPane from './StatusPane.svelte';
  import WithTableInspector from './table-inspector/WithTableInspector.svelte';

  type Context = 'page' | 'widget' | 'shared-consumer-page';

  const tabularData = getTabularDataStoreFromContext();
  const userProfile = getUserProfileStoreFromContext();

  $: database = $currentDatabase;
  $: schema = $currentSchema;
  $: canExecuteDDL = !!$userProfile?.hasPermission(
    { database, schema },
    'canExecuteDDL',
  );

  export let context: Context = 'page';
  export let table: Pick<TableEntry, 'id' | 'settings' | 'schema'>;

  $: usesVirtualList = context !== 'widget';
  $: allowsDdlOperations = context !== 'widget' && canExecuteDDL;
  $: sheetHasBorder = context === 'widget';
  $: ({ processedColumns, display, isLoading, selection, recordsData } =
    $tabularData);
  $: clipboardHandler = new SheetClipboardHandler({
    selection,
    toast,
    getRows: () => [
      ...get(recordsData.savedRecords),
      ...get(recordsData.newRecords),
    ],
    getColumnsMap: () => get(processedColumns),
    getRecordSummaries: () => get(recordsData.recordSummaries),
  });
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
  $: supportsTableInspector = context === 'page';
  $: sheetColumns = (() => {
    const orderedProcessedColumns = orderProcessedColumns(
      $processedColumns,
      table,
    );
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
  $: showTableInspector = $isTableInspectorVisible && supportsTableInspector;

  function selectAndActivateFirstCellOnTableLoad(
    _isLoading: boolean,
    _selection: TabularDataSelection,
    _context: Context,
  ) {
    // We only activate the first cell on the page, not in the widget. Doing so
    // on the widget causes the cell to focus and the page to scroll down to
    // bring that element into view.
    if (_context !== 'widget' && !_isLoading) {
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

  $: void selectAndActivateFirstCellOnTableLoad($isLoading, selection, context);
</script>

<div class="table-view">
  <WithTableInspector {context} {showTableInspector}>
    <div class="sheet-area" on:click={checkAndReinstateFocusOnActiveCell}>
      {#if $processedColumns.size}
        <Sheet
          columns={sheetColumns}
          getColumnIdentifier={(entry) => entry.column.id}
          {usesVirtualList}
          {columnWidths}
          {clipboardHandler}
          hasBorder={sheetHasBorder}
          restrictWidthToRowWidth={!usesVirtualList}
          bind:horizontalScrollOffset={$horizontalScrollOffset}
          bind:scrollOffset={$scrollOffset}
          hasPaddingRight
        >
          <Header {hasNewColumnButton} {columnOrder} {table} />
          <Body {usesVirtualList} />
        </Sheet>
      {/if}
    </div>
  </WithTableInspector>
  <StatusPane {context} />
</div>

<style>
  .table-view {
    display: grid;
    grid-template: 1fr auto / 1fr;
    height: 100%;
    overflow: hidden;
  }
  .sheet-area {
    position: relative;
    height: 100%;
    overflow-x: auto;
  }
</style>
