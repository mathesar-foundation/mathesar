<script lang="ts">
  import { writable } from 'svelte/store';
  import { setTabularDataStoreInContext } from '@mathesar/stores/table-data';
  import type { TabularData } from '@mathesar/stores/table-data/types';
  import ActionsPane from './actions-pane/ActionsPane.svelte';
  import Header from './header/Header.svelte';
  import Body from './Body.svelte';
  import StatusPane from './status-pane/StatusPane.svelte';

  export let tabularData: TabularData;

  const tabularDataContextStore = writable(tabularData);
  setTabularDataStoreInContext(tabularDataContextStore);

  $: tabularDataContextStore.set(tabularData);
  $: ({ processedColumns, constraintsDataStore } = tabularData);
  $: hasForeignKeys = $constraintsDataStore.constraints.some(
    (c) => c.type === 'foreignkey',
  );
</script>

<ActionsPane />

<div class="table-data">
  <div class="table-content" class:has-foreign-keys={hasForeignKeys}>
    {#if $processedColumns.size}
      <Header />
      <!-- We'd eventually replace Body with Sheet -->
      <Body />
    {/if}
  </div>
</div>

<StatusPane />

<style global lang="scss">
  @import 'TableView.scss';
</style>
