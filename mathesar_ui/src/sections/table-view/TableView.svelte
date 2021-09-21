<script lang="ts">
  import { setContext } from 'svelte';
  import { writable } from 'svelte/store';
  import { getTableContent } from '@mathesar/stores/table-data';
  import type {
    TabularData,
    Columns,
    Display,
  } from '@mathesar/stores/table-data/types';
  // import URLQueryHandler from '@mathesar/utils/urlQueryHandler';

  import ActionsPane from './actions-pane/ActionsPane.svelte';
  import DisplayOptions from './display-options/DisplayOptions.svelte';
  import DeleteTable from './actions-pane/DeleteTable.svelte';
  import Header from './Header.svelte';
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

  function tableDelete() {
    isModalOpen = true;
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
        <DeleteTable bind:isOpen={isModalOpen}/>
      {/if}  
    {/if}
  </div>
</div>

<StatusPane/>

<style global lang="scss">
  @import "TableView.scss";
</style>
