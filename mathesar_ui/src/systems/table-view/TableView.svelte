<script lang="ts">
  import { map } from 'iter-tools';
  import type { ComponentProps } from 'svelte';
  import { get } from 'svelte/store';
  import { _ } from 'svelte-i18n';

  import { ImmutableMap, Spinner } from '@mathesar/component-library';
  import { Sheet } from '@mathesar/components/sheet';
  import { SheetClipboardHandler } from '@mathesar/components/sheet/clipboard';
  import { ROW_HEADER_WIDTH_PX } from '@mathesar/geometry';
  import { iconPaste } from '@mathesar/icons';
  import type { Table } from '@mathesar/models/Table';
  import { confirm } from '@mathesar/stores/confirmation';
  import { tableInspectorVisible } from '@mathesar/stores/localStorage';
  import {
    ID_ADD_NEW_COLUMN,
    ID_ROW_CONTROL_COLUMN,
    getTabularDataStoreFromContext,
  } from '@mathesar/stores/table-data';
  import { toast } from '@mathesar/stores/toast';
  import { stringifyMapKeys } from '@mathesar/utils/collectionUtils';

  import Body from './Body.svelte';
  import Header from './header/Header.svelte';
  import StatusPane from './StatusPane.svelte';
  import WithTableInspector from './table-inspector/WithTableInspector.svelte';
  import { getCustomizedColumnWidths } from './tableViewUtils';

  type Context = 'page' | 'widget' | 'shared-consumer-page';

  const tabularData = getTabularDataStoreFromContext();

  export let context: Context = 'page';
  export let table: Table;
  export let sheetElement: HTMLElement | undefined = undefined;

  let tableInspectorTab: ComponentProps<WithTableInspector>['activeTabId'] =
    'table';

  $: ({ currentRoleOwns } = table.currentAccess);
  $: usesVirtualList = context !== 'widget';
  $: sheetHasBorder = context === 'widget';
  $: ({ processedColumns, display, isLoading, selection, recordsData } =
    $tabularData);
  $: clipboardHandler = new SheetClipboardHandler({
    copyingContext: {
      getRows: () =>
        new Map(
          map(([k, r]) => [k, r.record], get(recordsData.selectableRowsMap)),
        ),
      getColumns: () => stringifyMapKeys(get(processedColumns)),
      getRecordSummaries: () => get(recordsData.linkedRecordSummaries),
    },
    pastingContext: {
      getRecordRows: () => [
        ...get(recordsData.fetchedRecordRows),
        ...get(recordsData.newRecords),
      ],
      getSheetColumns: () => [
        ...map(({ column }) => column, get(processedColumns).values()),
      ],
      updateRecords: (r) => recordsData.bulkUpdate(r),
      setSelection: (s) => selection.set(s),
      confirm: (title) =>
        confirm({
          title,
          body: [],
          proceedButton: { label: $_('paste'), icon: iconPaste },
        }),
    },
    getSelection: () => get(selection),
    showToastInfo: toast.info,
    showToastError: toast.error,
  });
  $: ({ horizontalScrollOffset, scrollOffset } = display);
  $: columnOrder = table.metadata?.column_order ?? [];
  $: hasNewColumnButton = context !== 'widget' && $currentRoleOwns;
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

  $: columnWidths = new ImmutableMap([
    [ID_ROW_CONTROL_COLUMN, ROW_HEADER_WIDTH_PX],
    [ID_ADD_NEW_COLUMN, 32],
    ...getCustomizedColumnWidths($processedColumns.values()),
  ]);
  $: showTableInspector = $tableInspectorVisible && supportsTableInspector;
</script>

<div class="table-view" class:inspector-open={showTableInspector}>
  <WithTableInspector
    {context}
    {showTableInspector}
    bind:activeTabId={tableInspectorTab}
  >
    <div class="sheet-area">
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
      {:else if $isLoading}
        <div class="loading-sheet">
          <Spinner />
        </div>
      {/if}
    </div>
  </WithTableInspector>
</div>
<StatusPane {context} />

<style>
  .table-view {
    display: grid;
    grid-template: 1fr auto / 1fr;
    height: 100%;
    overflow: hidden;
    padding: 0 var(--sm3);
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
    color: var(--neutral-500);
  }
</style>
