<script lang="ts">
  import { writable } from 'svelte/store';
  import {
    setTabularDataStoreInContext,
    ID_ROW_CONTROL_COLUMN,
    ID_ADD_NEW_COLUMN,
  } from '@mathesar/stores/table-data';
  import type { TabularData } from '@mathesar/stores/table-data/types';
  import { currentDbAbstractTypes } from '@mathesar/stores/abstract-types';
  import { ImmutableMap } from '@mathesar/component-library';
  import { Sheet } from '@mathesar/components/sheet';
  import ActionsPane from './actions-pane/ActionsPane.svelte';
  import Header from './header/Header.svelte';
  import Body from './Body.svelte';
  import StatusPane from './status-pane/StatusPane.svelte';
  import { getProcessedColumnsMap } from './utils';

  export let tabularData: TabularData;

  const tabularDataContextStore = writable(tabularData);
  setTabularDataStoreInContext(tabularDataContextStore);

  $: tabularDataContextStore.set(tabularData);
  $: ({ columnsDataStore, constraintsDataStore } = tabularData);

  /**
   * This would ideally be part of the context. But since, we'd be
   * refactoring the component structure when Sheet component is
   * created, the path of minimal changes is taken and is passed
   * down as a prop.
   */
  $: processedTableColumnsMap = getProcessedColumnsMap(
    $columnsDataStore.columns,
    $constraintsDataStore.constraints,
    $currentDbAbstractTypes.data,
  );

  $: sheetColumns = [
    { column: { id: ID_ROW_CONTROL_COLUMN, name: 'ROW_CONTROL' } },
    ...processedTableColumnsMap.values(),
    { column: { id: ID_ADD_NEW_COLUMN, name: 'ADD_NEW_COLUMN_PHANTOM' } },
  ];

  const columnWidths = new ImmutableMap([
    [ID_ROW_CONTROL_COLUMN, 70],
    [ID_ADD_NEW_COLUMN, 100],
  ]);
</script>

<ActionsPane {processedTableColumnsMap} />

<div class="table-data">
  {#if processedTableColumnsMap.size}
    <Sheet
      columns={sheetColumns}
      getColumnIdentifier={(entry) => entry.column.id}
      {columnWidths}
    >
      <Header {processedTableColumnsMap} />
      <Body {processedTableColumnsMap} />
    </Sheet>
  {/if}
</div>

<StatusPane />

<style global lang="scss">
  @import 'TableView.scss';
</style>
