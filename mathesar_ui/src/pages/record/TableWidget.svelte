<script lang="ts">
  import type { TableEntry } from '@mathesar/api/types/tables';
  import type { Column } from '@mathesar/api/types/tables/columns';
  import TableName from '@mathesar/components/TableName.svelte';
  import { currentDbAbstractTypes } from '@mathesar/stores/abstract-types';
  import {
    Meta,
    setTabularDataStoreInContext,
    TabularData,
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

  export let recordId: number;
  export let table: Pick<TableEntry, 'id' | 'name'>;
  export let fkColumn: Pick<Column, 'id' | 'name'>;

  $: abstractTypesMap = $currentDbAbstractTypes.data;
  $: tabularData = new TabularData({
    id: table.id,
    abstractTypesMap,
    meta,
    contextualFilters: new Map([[fkColumn.id, recordId]]),
  });
  $: tabularDataStore.set(tabularData);
</script>

<div class="table-widget">
  <div class="top">
    <h3><TableName {table} /></h3>
    <MiniActionsPane />
  </div>

  <div class="results">
    <TableView context="widget" />
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
    > h3 {
      font-size: var(--text-size-large);
      font-weight: 500;
    }
  }
  .top > :global(*) {
    overflow: hidden;
  }
</style>
