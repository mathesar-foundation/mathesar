<script lang="ts">
  import { router } from 'tinro';

  import type { TableEntry } from '@mathesar/api/tables';
  import type { Database, SchemaEntry } from '@mathesar/AppTypes';
  import LayoutWithHeader from '@mathesar/layouts/LayoutWithHeader.svelte';
  import { currentDbAbstractTypes } from '@mathesar/stores/abstract-types';
  import {
    setTabularDataStoreInContext,
    TabularData,
    Meta,
  } from '@mathesar/stores/table-data';
  import TableView from '@mathesar/systems/table-view/TableView.svelte';
  import ActionsPane from '@mathesar/systems/table-view/actions-pane/ActionsPane.svelte';
  import { makeSimplePageTitle } from '@mathesar/pages/pageTitleUtils';

  const tabularDataStore = setTabularDataStoreInContext(
    // Sacrifice type safety here since the value is initialized reactively
    // below.
    undefined as unknown as TabularData,
  );

  export let database: Database;
  export let schema: SchemaEntry;
  export let table: TableEntry;

  $: abstractTypesMap = $currentDbAbstractTypes.data;
  $: ({ hash } = $router);
  $: meta = Meta.fromSerialization(hash);
  $: tabularData = new TabularData({
    id: table.id,
    abstractTypesMap,
    meta,
  });
  $: tabularDataStore.set(tabularData);

  function handleMetaSerializationChange(s: string) {
    router.location.hash.set(s);
  }
  $: metaSerialization = tabularData.meta.serialization;
  $: handleMetaSerializationChange($metaSerialization);
</script>

<svelte:head><title>{makeSimplePageTitle(table.name)}</title></svelte:head>

<LayoutWithHeader fitViewport>
  <div class="table-page">
    <ActionsPane {database} {schema} {table} />
    <TableView usesVirtualList allowsDdlOperations />
  </div>
</LayoutWithHeader>

<style>
  .table-page {
    display: grid;
    grid-template: auto 1fr / 1fr;
    height: 100%;
  }
</style>
