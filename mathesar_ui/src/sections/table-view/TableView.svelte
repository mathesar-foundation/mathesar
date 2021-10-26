<script lang="ts">
  import { setContext } from 'svelte';
  import { writable } from 'svelte/store';
  import { getTableContent } from '@mathesar/stores/table-data';
  import { currentSchemaId, getSchemaInfo } from '@mathesar/stores/schemas';
  import { currentDBName } from '@mathesar/stores/databases';
  import { getActiveTabValue, removeTab } from '@mathesar/stores/tabs';
  import type {
    TabularData,
    Columns,
  } from '@mathesar/stores/table-data/types';
  import {
    refetchTablesForSchema,
    deleteTable,
  } from '@mathesar/stores/tables';
  import type { MathesarTab } from '@mathesar/stores/tabs';
  // import URLQueryHandler from '@mathesar/utils/urlQueryHandler';

  import ActionsPane from './actions-pane/ActionsPane.svelte';
  import DeleteTableModal from './actions-pane/DeleteTableModal.svelte';
  import Header from './header/Header.svelte';
  import Body from './Body.svelte';
  import StatusPane from './status-pane/StatusPane.svelte';

  const tabularData = writable(null as TabularData);
  setContext('tabularData', tabularData);

  export let database: string;
  export let id: unknown;
  $: identifier = id as number;

  let columns: Columns;

  // let tableBodyRef: Body;
  let isModalOpen = false;
  let activeTab: MathesarTab;

  function setStores(_database: string, _id: number) {
    // const opts = URLQueryHandler.getTableConfig(_database, _id);
    const data = getTableContent(_id);
    tabularData.set({
      id: _id,
      ...data,
    });
    ({ columns } = data);
  }

  $: setStores(database, identifier);

  async function deleteConfirm() {
    removeTab($currentDBName, $currentSchemaId, activeTab);
    await deleteTable(activeTab.id);
    isModalOpen = false;
    await refetchTablesForSchema($currentSchemaId);
  }

  function tableDelete() {
    const { has_dependencies: hasDependencies } = getSchemaInfo($currentDBName, $currentSchemaId);
    const nameActiveTab = getActiveTabValue($currentDBName, $currentSchemaId);
    activeTab = nameActiveTab;
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
    {#if $columns.data.length > 0}
      <Header/>
      <Body/>
      {#if isModalOpen}
        <DeleteTableModal bind:isOpen={isModalOpen} bind:activeTab on:deleteConfirm={deleteConfirm}/>
      {/if}  
    {/if}
  </div>
</div>

<StatusPane/>

<style global lang="scss">
  @import "TableView.scss";
</style>
