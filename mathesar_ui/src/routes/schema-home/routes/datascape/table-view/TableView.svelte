<script lang="ts">
  import { writable } from 'svelte/store';
  import {
    setTabularDataStoreInContext,
    ID_ROW_CONTROL_COLUMN,
    ID_ADD_NEW_COLUMN,
  } from '@mathesar/stores/table-data';
  import type { TabularData } from '@mathesar/stores/table-data/types';
  import { ImmutableMap } from '@mathesar/component-library';
  import { Sheet } from '@mathesar/components/sheet';
  import ActionsPane from './actions-pane/ActionsPane.svelte';
  import Header from './header/Header.svelte';
  import Body from './Body.svelte';
  import StatusPane from './status-pane/StatusPane.svelte';

  export let tabularData: TabularData;

  const tabularDataContextStore = writable(tabularData);
  setTabularDataStoreInContext(tabularDataContextStore);

  $: tabularDataContextStore.set(tabularData);
  $: ({ processedColumns, display } = tabularData);
  $: ({ horizontalScrollOffset, scrollOffset } = display);

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

<ActionsPane />

<div class="table-data">
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

<StatusPane />

<style global lang="scss">
  @import 'TableView.scss';
</style>
