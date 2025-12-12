<script lang="ts">
  import { tick } from 'svelte';
  import { _ } from 'svelte-i18n';
  import { router } from 'tinro';

  import WarningBox from '@mathesar/components/message-boxes/WarningBox.svelte';
  import { focusActiveCell } from '@mathesar/components/sheet/utils';
  import LayoutWithHeader from '@mathesar/layouts/LayoutWithHeader.svelte';
  import type { Table } from '@mathesar/models/Table';
  import { makeSimplePageTitle } from '@mathesar/pages/pageTitleUtils';
  import {
    Meta,
    TabularData,
    setTabularDataStoreInContext,
  } from '@mathesar/stores/table-data';
  import WithModalRecordView from '@mathesar/systems/record-view-modal/WithModalRecordView.svelte';
  import ActionsPane from '@mathesar/systems/table-view/actions-pane/ActionsPane.svelte';
  import TableView from '@mathesar/systems/table-view/TableView.svelte';

  import {
    ImperativeFilterController,
    imperativeFilterControllerContext,
  } from './ImperativeFilterController';

  const metaSerializationQueryKey = 'q';

  const tabularDataStore = setTabularDataStoreInContext(
    // Sacrifice type safety here since the value is initialized reactively
    // below.
    undefined as unknown as TabularData,
  );

  const imperativeFilterController = new ImperativeFilterController();
  imperativeFilterControllerContext.set(imperativeFilterController);

  export let table: Table;

  let sheetElement: HTMLElement;

  $: ({ query } = $router);
  $: meta = Meta.fromSerialization(query[metaSerializationQueryKey] ?? '');
  $: ({ currentRolePrivileges } = table.currentAccess);
  $: tabularData = new TabularData({
    database: table.schema.database,
    table,
    meta,
  });
  $: ({ isLoading, selection } = tabularData);
  $: tabularDataStore.set(tabularData);

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
    <ActionsPane />
    {#if $currentRolePrivileges.has('SELECT')}
      <WithModalRecordView>
        <div class="table-view-area">
          <TableView {table} bind:sheetElement />
        </div>
      </WithModalRecordView>
    {:else}
      <div class="warning">
        <WarningBox fullWidth>
          {$_('no_privileges_view_table')}
        </WarningBox>
      </div>
    {/if}
  </div>
</LayoutWithHeader>

<style>
  .table-page {
    display: grid;
    grid-template: auto 1fr / 1fr;
    height: 100%;
  }
  .warning {
    padding: 1rem;
  }
  .table-view-area {
    padding: 0 var(--sm3) var(--sm3) var(--sm3);
    height: 100%;
    display: grid;
  }
</style>
