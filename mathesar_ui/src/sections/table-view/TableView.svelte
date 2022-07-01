<script lang="ts">
  import { writable } from 'svelte/store';
  import { setTabularDataStoreInContext } from '@mathesar/stores/table-data';
  import type { TabularData } from '@mathesar/stores/table-data/types';
  import { currentDbAbstractTypes } from '@mathesar/stores/abstract-types';
  import ActionsPane from './actions-pane/ActionsPane.svelte';
  import Header from './header/Header.svelte';
  import Body from './Body.svelte';
  import StatusPane from './status-pane/StatusPane.svelte';
  import { getProcessedColumnsMap } from './utils';

  export let tabularData: TabularData;

  const tabularDataContextStore = writable(tabularData);
  setTabularDataStoreInContext(tabularDataContextStore);

  $: tabularDataContextStore.set(tabularData);
  $: ({ columnsDataStore, constraintsDataStore } = tabularData);

  /**
   * This would ideally be part of the context. But since, we'd be
   * refactoring the component structure when Sheet component is
   * created, the path of minimal changes is taken and is passed
   * down as a prop.
   */
  $: processedTableColumnsMap = getProcessedColumnsMap(
    $columnsDataStore.columns,
    $constraintsDataStore.constraints,
    $currentDbAbstractTypes.data,
  );
</script>

<ActionsPane {processedTableColumnsMap} />

<div class="table-data">
  <div class="table-content">
    {#if processedTableColumnsMap.size}
      <Header {processedTableColumnsMap} />
      <!-- We'd eventually replace Body with Sheet -->
      <Body {processedTableColumnsMap} />
    {/if}
  </div>
</div>

<StatusPane />

<style global lang="scss">
  @import 'TableView.scss';
</style>
