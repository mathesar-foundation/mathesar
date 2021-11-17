<script lang="ts">
  import { setContext } from 'svelte';
  import { writable } from 'svelte/store';
  import { currentSchemaId, getSchemaInfo } from '@mathesar/stores/schemas';
  import { currentDBName } from '@mathesar/stores/databases';
  import { getTabsForSchema } from '@mathesar/stores/tabs';
  import type {
    TabularData,
    ColumnsDataStore,
  } from '@mathesar/stores/table-data/types';
  import {
    refetchTablesForSchema,
    deleteTable,
  } from '@mathesar/stores/tables';

  import ActionsPane from './actions-pane/ActionsPane.svelte';
  import DeleteTableModal from './actions-pane/DeleteTableModal.svelte';
  import Header from './header/Header.svelte';
  import Body from './Body.svelte';
  import StatusPane from './status-pane/StatusPane.svelte';

  export let tabularData: TabularData;

  let columnsDataStore: ColumnsDataStore;
  let isModalOpen = false;

  const tabularDataContextStore = writable(tabularData);
  setContext('tabularData', tabularDataContextStore);

  $: tabularDataContextStore.set(tabularData);
  $: ({ columnsDataStore } = tabularData);

  async function deleteConfirm() {
    const tabList = getTabsForSchema($currentDBName, $currentSchemaId);
    const tab = tabList.getTabularTabByTabularID(tabularData.type, tabularData.id);
    tabList.remove(tab);

    await deleteTable(tabularData.id);
    isModalOpen = false;
    await refetchTablesForSchema($currentSchemaId);
  }

  function tableDelete() {
    const { has_dependencies: hasDependencies } = getSchemaInfo($currentDBName, $currentSchemaId);
    if (hasDependencies) {
      isModalOpen = true;
    } else {
      void deleteConfirm();
    }
  }
</script>

<ActionsPane on:deleteTable={tableDelete}/>

<div class="table-data">
  <div class="table-content">
    {#if $columnsDataStore.columns.length > 0}
      <Header/>
      <Body/>
      {#if isModalOpen}
        <DeleteTableModal bind:isOpen={isModalOpen} on:deleteConfirm={deleteConfirm}/>
      {/if}
    {/if}
  </div>
</div>

<StatusPane/>

<style global lang="scss">
  @import "TableView.scss";
</style>
