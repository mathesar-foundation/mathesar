<script lang="ts">
  import { setContext } from 'svelte';
  import { writable } from 'svelte/store';
  import type {
    TabularData,
    ColumnsDataStore,
  } from '@mathesar/stores/table-data/types';

  import ActionsPane from './actions-pane/ActionsPane.svelte';
  import Header from './header/Header.svelte';
  import Body from './Body.svelte';
  import StatusPane from './status-pane/StatusPane.svelte';

  export let tabularData: TabularData;

  let columnsDataStore: ColumnsDataStore;

  const tabularDataContextStore = writable(tabularData);
  setContext('tabularData', tabularDataContextStore);

  $: tabularDataContextStore.set(tabularData);
  $: ({ columnsDataStore } = tabularData);
</script>

<ActionsPane />

<div class="table-data">
  <div class="table-content">
    {#if $columnsDataStore.columns.length > 0}
      <Header />
      <Body />
    {/if}
  </div>
</div>

<StatusPane />

<style global lang="scss">
  @import 'TableView.scss';
</style>
