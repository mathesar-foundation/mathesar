<script lang="ts">
  import { setContext } from 'svelte';
  import { writable } from 'svelte/store';
  import { getTableContent } from '@mathesar/stores/table-data';
  import type {
    TabularData,
    Columns,
  } from '@mathesar/stores/table-data/types';
  // import URLQueryHandler from '@mathesar/utils/urlQueryHandler';

  import ActionsPane from './actions-pane/ActionsPane.svelte';
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
</script>

<ActionsPane/>

<div class="table-data">
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
