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
  import Header from './header/Header.svelte';
  import Body from './Body.svelte';
  import StatusPane from './status-pane/StatusPane.svelte';

  const tabularData = writable(null as TabularData);
  setContext('tabularData', tabularData);

  export let database: string;
  export let id: unknown;
  $: identifier = id as number;

  /**
   * idKey is only modified after table display properties
   * are set.
   *
   * It is used for recreating the virtual list instance, so
   * it should only be set in the same tick as the required
   * props for virtual list.
   */
  let columns: Columns;
  let showDisplayOptions: Display['showDisplayOptions'];

  // let tableBodyRef: Body;
  let animateOpts = false;

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

  // function reload(event: { detail: { resetPositions?: boolean } }) {
  //   const resetPositions = event?.detail?.resetPositions || false;
  //   void records.fetch();
  //   // URLQueryHandler.setTableOptions(database, identifier, $options);
  //   if (tableBodyRef) {
  //     // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  //     tableBodyRef.reloadPositions(resetPositions);
  //   }
  // }

  function openDisplayOptions() {
    animateOpts = true;
    showDisplayOptions.set(true);
  }

  function closeDisplayOptions() {
    animateOpts = true;
    showDisplayOptions.set(false);
  }
</script>

<ActionsPane on:openDisplayOptions={openDisplayOptions}/>

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
    {/if}
  </div>
</div>

<StatusPane/>

<style global lang="scss">
  @import "TableView.scss";
</style>
