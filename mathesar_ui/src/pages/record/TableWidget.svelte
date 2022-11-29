<script lang="ts">
  import type { TableEntry } from '@mathesar/api/types/tables';
  import type { Column } from '@mathesar/api/types/tables/columns';
  import { Icon } from '@mathesar/component-library';
  import { iconMultipleRecords } from '@mathesar/icons';
  import {
    setTabularDataStoreInContext,
    TabularData,
    Meta,
  } from '@mathesar/stores/table-data';
  import TableView from '@mathesar/systems/table-view/TableView.svelte';
  import { currentDbAbstractTypes } from '@mathesar/stores/abstract-types';
  import Pagination from '@mathesar/utils/Pagination';
  import MiniActionsPane from '@mathesar/systems/table-view/actions-pane/MiniActionsPane.svelte';

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
    <div class="left">
      <Icon {...iconMultipleRecords} size="1.4rem" />
      <h3 class="heading">{table.name}</h3>
    </div>
    <div class="right">
      <MiniActionsPane />
    </div>
  </div>

  <div class="results">
    <TableView />
  </div>
</div>

<style>
  .top {
    --spacing-x: 1rem;
    --spacing-y: 0.3rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin: calc(-1 * var(--spacing-y)) calc(-1 * var(--spacing-x));
    padding-bottom: 1rem;
    flex-wrap: wrap;
  }
  .top > :global(*) {
    margin: var(--spacing-y) var(--spacing-x);
  }
  .left {
    display: grid;
    grid-auto-flow: column;
    gap: 0.5rem;
    align-items: center;
  }
  .heading {
    margin: 0;
  }
  .right {
    flex: 1 0 auto;
    display: flex;
    justify-content: flex-end;
  }
</style>
