<script lang="ts">
  import { router } from 'tinro';

  import type { TableEntry } from '@mathesar/api/tables';
  import type { Database, SchemaEntry } from '@mathesar/AppTypes';
  import LayoutWithHeader from '@mathesar/layouts/LayoutWithHeader.svelte';
  import { getSchemaPageUrl } from '@mathesar/routes/urls';
  import { currentDbAbstractTypes } from '@mathesar/stores/abstract-types';
  import { Meta } from '@mathesar/stores/table-data';
  import {
    setTabularDataStoreInContext,
    TabularData,
  } from '@mathesar/stores/table-data/tabularData';
  import TableView from '@mathesar/systems/table-view/TableView.svelte';
  import ActionsPane from '@mathesar/systems/table-view/actions-pane/ActionsPane.svelte';

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

  function handleDeleteTable() {
    router.goto(getSchemaPageUrl(database.name, schema.id));
  }
</script>

<svelte:head>
  <title>{table.name} | {schema.name} | Mathesar</title>
</svelte:head>

<LayoutWithHeader fitViewport>
  <div class="table-page">
    <ActionsPane {schema} {table} on:deleteTable={handleDeleteTable} />
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
