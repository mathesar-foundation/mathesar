<script lang="ts">
  import { router } from 'tinro';

  import type { TableEntry } from '@mathesar/api/rest/types/tables';
  import LayoutWithHeader from '@mathesar/layouts/LayoutWithHeader.svelte';
  import { makeSimplePageTitle } from '@mathesar/pages/pageTitleUtils';
  import { currentDbAbstractTypes } from '@mathesar/stores/abstract-types';
  import {
    Meta,
    TabularData,
    setTabularDataStoreInContext,
  } from '@mathesar/stores/table-data';
  import ActionsPane from '@mathesar/systems/table-view/actions-pane/ActionsPane.svelte';
  import TableView from '@mathesar/systems/table-view/TableView.svelte';
  import type { ShareConsumer } from '@mathesar/utils/shares';

  import { setNewImperativeFilterControllerInContext } from './ImperativeFilterController';

  const metaSerializationQueryKey = 'q';

  const tabularDataStore = setTabularDataStoreInContext(
    // Sacrifice type safety here since the value is initialized reactively
    // below.
    undefined as unknown as TabularData,
  );
  setNewImperativeFilterControllerInContext();

  export let table: TableEntry;
  export let shareConsumer: ShareConsumer | undefined = undefined;

  $: abstractTypesMap = $currentDbAbstractTypes.data;
  $: ({ query } = $router);
  $: meta = Meta.fromSerialization(query[metaSerializationQueryKey] ?? '');
  $: tabularData = new TabularData({
    id: table.id,
    abstractTypesMap,
    meta,
    table,
    shareConsumer,
  });
  $: tabularDataStore.set(tabularData);
  let context: 'shared-consumer-page' | 'page' = 'page';
  $: context = shareConsumer ? 'shared-consumer-page' : 'page';

  function handleMetaSerializationChange(s: string) {
    router.location.query.set(metaSerializationQueryKey, s);
  }
  $: metaSerialization = tabularData.meta.serialization;
  $: handleMetaSerializationChange($metaSerialization);
</script>

<svelte:head><title>{makeSimplePageTitle(table.name)}</title></svelte:head>

<LayoutWithHeader fitViewport restrictWidth={false}>
  <div class="table-page">
    <ActionsPane {table} {context} />
    <TableView {table} {context} />
  </div>
</LayoutWithHeader>

<style>
  .table-page {
    display: grid;
    grid-template: auto 1fr / 1fr;
    height: 100%;
  }
</style>
