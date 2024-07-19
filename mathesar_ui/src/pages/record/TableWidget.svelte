<script lang="ts">
  import type { Column } from '@mathesar/api/rest/types/tables/columns';
  import type { Table } from '@mathesar/api/rpc/tables';
  import TableName from '@mathesar/components/TableName.svelte';
  import { currentDbAbstractTypes } from '@mathesar/stores/abstract-types';
  import {
    Meta,
    TabularData,
    setTabularDataStoreInContext,
  } from '@mathesar/stores/table-data';
  import MiniActionsPane from '@mathesar/systems/table-view/actions-pane/MiniActionsPane.svelte';
  import TableView from '@mathesar/systems/table-view/TableView.svelte';
  import Pagination from '@mathesar/utils/Pagination';

  const tabularDataStore = setTabularDataStoreInContext(
    // Sacrifice type safety here since the value is initialized reactively
    // below.
    undefined as unknown as TabularData,
  );
  const meta = new Meta({
    pagination: new Pagination({ size: 10 }),
  });

  export let recordPk: string;
  export let table: Table;
  export let fkColumn: Pick<Column, 'id' | 'name'>;

  $: abstractTypesMap = $currentDbAbstractTypes.data;
  $: tabularData = new TabularData({
    id: table.oid,
    abstractTypesMap,
    meta,
    contextualFilters: new Map([[fkColumn.id, recordPk]]),
    table,
  });
  $: tabularDataStore.set(tabularData);
</script>

<div class="table-widget">
  <div class="top">
    <h3 class="bold-header"><TableName {table} /></h3>
    <MiniActionsPane />
  </div>

  <div class="results">
    <TableView context="widget" {table} />
  </div>
</div>

<style lang="scss">
  .top {
    display: grid;
    grid-template: auto / 1fr auto;
    gap: 0.5rem;
    justify-content: space-between;
    align-items: center;

    overflow: hidden;
  }
  .top > :global(*) {
    overflow: hidden;
  }
</style>
