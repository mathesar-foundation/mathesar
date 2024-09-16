<script lang="ts">
  import { tick } from 'svelte';
  import { router } from 'tinro';

  import { focusActiveCell } from '@mathesar/components/sheet/utils';
  import LayoutWithHeader from '@mathesar/layouts/LayoutWithHeader.svelte';
  import type { Table } from '@mathesar/models/Table';
  import { makeSimplePageTitle } from '@mathesar/pages/pageTitleUtils';
  import { abstractTypesMap } from '@mathesar/stores/abstract-types';
  import { currentDatabase } from '@mathesar/stores/databases';
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

  export let table: Table;
  export let shareConsumer: ShareConsumer | undefined = undefined;

  let sheetElement: HTMLElement;

  $: ({ query } = $router);
  $: meta = Meta.fromSerialization(query[metaSerializationQueryKey] ?? '');
  $: tabularData = new TabularData({
    database: $currentDatabase,
    table,
    abstractTypesMap,
    meta,
    shareConsumer,
  });
  $: ({ isLoading, selection } = tabularData);
  $: tabularDataStore.set(tabularData);
  let context: 'shared-consumer-page' | 'page' = 'page';
  $: context = shareConsumer ? 'shared-consumer-page' : 'page';

  async function activateFirstDataCell() {
    selection.updateWithoutFocus((s) => s.ofFirstDataCell());
    // Don't steal focus if the user has already focused on another UI element
    // while the table data is loading.
    if (document.activeElement === document.body) {
      await tick();
      focusActiveCell(sheetElement);
    }
  }
  let hasInitialized = false;
  $: if (!hasInitialized && !$isLoading) {
    hasInitialized = true;
    void activateFirstDataCell();
  }

  function handleMetaSerializationChange(s: string) {
    router.location.query.set(metaSerializationQueryKey, s);
  }
  $: metaSerialization = tabularData.meta.serialization;
  $: handleMetaSerializationChange($metaSerialization);
</script>

<svelte:head><title>{makeSimplePageTitle(table.name)}</title></svelte:head>

<LayoutWithHeader fitViewport restrictWidth={false}>
  <div class="table-page">
    <ActionsPane {context} />
    <TableView {table} {context} bind:sheetElement />
  </div>
</LayoutWithHeader>

<style>
  .table-page {
    display: grid;
    grid-template: auto 1fr / 1fr;
    height: 100%;
  }
</style>
