<script lang="ts">
  import type { TableEntry } from '@mathesar/api/tables';
  import type { Database, SchemaEntry } from '@mathesar/AppTypes';
  import { ImmutableMap } from '@mathesar/component-library';
  import { Sheet } from '@mathesar/components/sheet';
  import {
    ID_ADD_NEW_COLUMN,
    ID_ROW_CONTROL_COLUMN,
    setTabularDataStoreInContext,
  } from '@mathesar/stores/table-data';
  import type { TabularData } from '@mathesar/stores/table-data/types';
  import { writable } from 'svelte/store';
  import ActionsPane from './actions-pane/ActionsPane.svelte';
  import Body from './Body.svelte';
  import Header from './header/Header.svelte';
  import StatusPane from './StatusPane.svelte';
  import TableInspector from './table-inspector/TableInspector.svelte';

  export let database: Database;
  export let schema: SchemaEntry;
  export let tabularData: TabularData;
  export let table: TableEntry;

  const tabularDataContextStore = writable(tabularData);
  setTabularDataStoreInContext(tabularDataContextStore);

  $: tabularDataContextStore.set(tabularData);
  $: ({ processedColumns, display } = tabularData);
  $: ({ horizontalScrollOffset, scrollOffset, isTableInspectorVisible } =
    display);

  $: sheetColumns = [
    { column: { id: ID_ROW_CONTROL_COLUMN, name: 'ROW_CONTROL' } },
    ...$processedColumns.values(),
    { column: { id: ID_ADD_NEW_COLUMN, name: 'ADD_NEW_COLUMN_PHANTOM' } },
  ];

  const columnWidths = new ImmutableMap([
    [ID_ROW_CONTROL_COLUMN, 70],
    [ID_ADD_NEW_COLUMN, 100],
  ]);
</script>

<div class="table-view">
  <ActionsPane {database} {schema} {table} on:deleteTable />
  <div class="table-inspector-view">
    <div class="sheet-area">
      {#if $processedColumns.size}
        <Sheet
          columns={sheetColumns}
          getColumnIdentifier={(entry) => entry.column.id}
          {columnWidths}
          bind:horizontalScrollOffset={$horizontalScrollOffset}
          bind:scrollOffset={$scrollOffset}
        >
          <Header />
          <Body />
        </Sheet>
      {/if}
    </div>
    {#if $isTableInspectorVisible}
      <TableInspector />
    {/if}
  </div>
  <StatusPane />
</div>

<style>
  .table-view {
    display: grid;
    grid-template: auto 1fr auto / 1fr;
    height: 100%;
  }
  .table-inspector-view {
    display: flex;
    flex-direction: row;
  }
  .sheet-area {
    position: relative;
    flex: 1;
  }
</style>
