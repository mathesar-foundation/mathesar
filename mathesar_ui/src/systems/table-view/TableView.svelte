<script lang="ts">
  import { ImmutableMap } from '@mathesar/component-library';
  import { Sheet } from '@mathesar/components/sheet';
  import {
    getTabularDataStoreFromContext,
    ID_ADD_NEW_COLUMN,
    ID_ROW_CONTROL_COLUMN,
  } from '@mathesar/stores/table-data';
  import { rowHeaderWidthPx } from '@mathesar/geometry';
  import Body from './Body.svelte';
  import Header from './header/Header.svelte';
  import StatusPane from './StatusPane.svelte';
  import TableInspector from './table-inspector/TableInspector.svelte';

  const tabularData = getTabularDataStoreFromContext();

  export let usesVirtualList = false;
  export let allowsDdlOperations = false;

  $: ({ processedColumns, display, isLoading } = $tabularData);
  $: ({ horizontalScrollOffset, scrollOffset, isTableInspectorVisible } =
    display);
  $: hasNewColumnButton = allowsDdlOperations;
  /**
   * These are separate variables for readability and also to keep the door open
   * to more easily displaying the Table Inspector even if DDL operations are
   * not supported.
   */
  $: supportsTableInspector = allowsDdlOperations;
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
    [ID_ADD_NEW_COLUMN, 100],
  ]);
  $: showTableInspector =
    $isTableInspectorVisible && !$isLoading && supportsTableInspector;
</script>

<div class="table-view">
  <div class="table-inspector-view">
    <div class="sheet-area">
      {#if $processedColumns.size}
        <Sheet
          columns={sheetColumns}
          getColumnIdentifier={(entry) => entry.column.id}
          {usesVirtualList}
          {columnWidths}
          bind:horizontalScrollOffset={$horizontalScrollOffset}
          bind:scrollOffset={$scrollOffset}
        >
          <Header {hasNewColumnButton} />
          <Body {usesVirtualList} />
        </Sheet>
      {/if}
    </div>
    {#if showTableInspector}
      <TableInspector />
    {/if}
  </div>
  <StatusPane />
</div>

<style>
  .table-view {
    display: grid;
    grid-template: 1fr auto / 1fr;
    height: 100%;
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
