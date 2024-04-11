<script lang="ts">
  import { map } from 'iter-tools';
  import { get } from 'svelte/store';

  import { ImmutableMap } from '@mathesar-component-library';
  import type { TableEntry } from '@mathesar/api/types/tables';
  import { Sheet } from '@mathesar/components/sheet';
  import { SheetClipboardHandler } from '@mathesar/components/sheet/SheetClipboardHandler';
  import { rowHeaderWidthPx } from '@mathesar/geometry';
  import { currentDatabase } from '@mathesar/stores/databases';
  import { currentSchema } from '@mathesar/stores/schemas';
  import {
    getTabularDataStoreFromContext,
    ID_ADD_NEW_COLUMN,
    ID_ROW_CONTROL_COLUMN,
    type ProcessedColumn,
  } from '@mathesar/stores/table-data';
  import {
    getRowSelectionId,
    type RecordRow,
  } from '@mathesar/stores/table-data/records';
  import { toast } from '@mathesar/stores/toast';
  import { getUserProfileStoreFromContext } from '@mathesar/stores/userProfile';
  import { stringifyMapKeys } from '@mathesar/utils/collectionUtils';
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
    getCopyingContext: () => ({
      rowsMap: new Map(
        map(([k, r]) => [k, r.record], get(recordsData.selectableRowsMap)),
      ),
      columnsMap: stringifyMapKeys(get(processedColumns)),
      recordSummaries: get(recordsData.recordSummaries),
      selectedRowIds: get(selection).rowIds,
      selectedColumnIds: get(selection).columnIds,
    }),
    showToastInfo: toast.info,
  });
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
    const columns = [
      { column: { id: ID_ROW_CONTROL_COLUMN, name: 'ROW_CONTROL' } },
      ...$processedColumns.values(),
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

  // // TODO_3037
  // function selectFirstCellOnTableLoad(_isLoading: boolean, _context: Context) {
  //   // We only activate the first cell on the page, not in the widget. Doing so
  //   // on the widget causes the cell to focus and the page to scroll down to
  //   // bring that element into view.
  //   if (_context !== 'widget' && !_isLoading) {
  //     selection.update((s) => s.ofFirstDataCell());
  //   }
  // }

  // $: void selectFirstCellOnTableLoad($isLoading, context);
</script>

<div class="table-view">
  <WithTableInspector {context} {showTableInspector}>
    <div class="sheet-area">
      {#if $processedColumns.size}
        <Sheet
          {clipboardHandler}
          {columnWidths}
          {selection}
          {usesVirtualList}
          bind:horizontalScrollOffset={$horizontalScrollOffset}
          bind:scrollOffset={$scrollOffset}
          columns={sheetColumns}
          getColumnIdentifier={(entry) => entry.column.id}
          hasBorder={sheetHasBorder}
          hasPaddingRight
          restrictWidthToRowWidth={!usesVirtualList}
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
