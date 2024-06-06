<script lang="ts">
  import { map } from 'iter-tools';
  import type { ComponentProps } from 'svelte';
  import { get } from 'svelte/store';

  import type { TableEntry } from '@mathesar/api/rest/types/tables';
  import { ImmutableMap, Spinner } from '@mathesar/component-library';
  import { Sheet } from '@mathesar/components/sheet';
  import { SheetClipboardHandler } from '@mathesar/components/sheet/SheetClipboardHandler';
  import { rowHeaderWidthPx } from '@mathesar/geometry';
  import { currentDatabase } from '@mathesar/stores/databases';
  import { currentSchema } from '@mathesar/stores/schemas';
  import {
    ID_ADD_NEW_COLUMN,
    ID_ROW_CONTROL_COLUMN,
    getTabularDataStoreFromContext,
  } from '@mathesar/stores/table-data';
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
  export let sheetElement: HTMLElement | undefined = undefined;

  let tableInspectorTab: ComponentProps<WithTableInspector>['activeTabId'] =
    'table';

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
</script>

<div class="table-view">
  <WithTableInspector
    {context}
    {showTableInspector}
    bind:activeTabId={tableInspectorTab}
  >
    <div class="sheet-area">
      {#if $isLoading}
        <div class="loading-sheet">
          <Spinner />
        </div>
      {/if}
      {#if $processedColumns.size}
        <Sheet
          {clipboardHandler}
          {columnWidths}
          {selection}
          {usesVirtualList}
          onCellSelectionStart={(cell) => {
            if (cell.type === 'column-header-cell') {
              tableInspectorTab = 'column';
            }
            if (cell.type === 'row-header-cell') {
              tableInspectorTab = 'record';
            }
          }}
          bind:horizontalScrollOffset={$horizontalScrollOffset}
          bind:scrollOffset={$scrollOffset}
          columns={sheetColumns}
          getColumnIdentifier={(entry) => entry.column.id}
          hasBorder={sheetHasBorder}
          hasPaddingRight
          restrictWidthToRowWidth={!usesVirtualList}
          bind:sheetElement
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
  .loading-sheet {
    text-align: center;
    font-size: 2rem;
    padding: 2rem;
    color: var(--slate-500);
  }
</style>
