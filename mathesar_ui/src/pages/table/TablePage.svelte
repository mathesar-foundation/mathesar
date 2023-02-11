<script lang="ts">
  import { router } from 'tinro';

  import type { TableEntry } from '@mathesar/api/types/tables';
  import { currentDbAbstractTypes } from '@mathesar/stores/abstract-types';
  import {
    setTabularDataStoreInContext,
    TabularData,
    Meta,
  } from '@mathesar/stores/table-data';
  import TableView from '@mathesar/systems/table-view/TableView.svelte';
  import ActionsPane from '@mathesar/systems/table-view/actions-pane/ActionsPane.svelte';
  import { makeSimplePageTitle } from '@mathesar/pages/pageTitleUtils';
  import LayoutWithHeader from '@mathesar/layouts/LayoutWithHeader.svelte';

  const metaSerializationQueryKey = 'q';

  const tabularDataStore = setTabularDataStoreInContext(
    // Sacrifice type safety here since the value is initialized reactively
    // below.
    undefined as unknown as TabularData,
  );

  export let table: TableEntry;

  $: abstractTypesMap = $currentDbAbstractTypes.data;
  $: ({ query } = $router);
  $: meta = Meta.fromSerialization(query[metaSerializationQueryKey] ?? '');
  $: tabularData = new TabularData({
    id: table.id,
    abstractTypesMap,
    meta,
    table,
  });
  $: tabularDataStore.set(tabularData);

  function handleMetaSerializationChange(s: string) {
    router.location.query.set(metaSerializationQueryKey, s);
  }
  $: metaSerialization = tabularData.meta.serialization;
  $: handleMetaSerializationChange($metaSerialization);
</script>

<svelte:head><title>{makeSimplePageTitle(table.name)}</title></svelte:head>

<LayoutWithHeader fitViewport restrictWidth={false}>
  <div class="table-page">
    <ActionsPane {table} />
    <TableView {table} />
  </div>
</LayoutWithHeader>

<style>
  .table-page {
    display: grid;
    grid-template: auto 1fr / 1fr;
    height: 100%;
  }
</style>
