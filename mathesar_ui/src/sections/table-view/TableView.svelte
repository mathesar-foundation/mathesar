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
    Display,
  } from '@mathesar/stores/table-data/types';
  import {
    refetchTablesForSchema,
    deleteTable,
  } from '@mathesar/stores/tables';
  // import URLQueryHandler from '@mathesar/utils/urlQueryHandler';

  import ActionsPane from './actions-pane/ActionsPane.svelte';
  import DisplayOptions from './display-options/DisplayOptions.svelte';
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
  let showDisplayOptions: Display['showDisplayOptions'];

  // let tableBodyRef: Body;
  let animateOpts = false;
  let isModalOpen = false;
  let activeTab;

  function setStores(_database: string, _id: number) {
    // const opts = URLQueryHandler.getTableConfig(_database, _id);
    const data = getTableContent(_id);
    tabularData.set({
      id: _id,
      ...data,
    });
    ({ columns } = data);
    ({ showDisplayOptions } = data.display);

    animateOpts = false;
  }

  $: setStores(database, identifier);

  function openDisplayOptions() {
    animateOpts = true;
    showDisplayOptions.set(true);
  }

  function closeDisplayOptions() {
    animateOpts = true;
    showDisplayOptions.set(false);
  }

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

<ActionsPane on:openDisplayOptions={openDisplayOptions} on:deleteTable={tableDelete}/>

<div class="table-data" class:animate-opts={animateOpts}
      class:has-display-opts={$showDisplayOptions}>
  <div class="display-options-pane">
    {#if $showDisplayOptions}
      <DisplayOptions on:close={closeDisplayOptions}/>
    {/if}
  </div>

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
