<script lang="ts">
  import type { Tab } from '@mathesar/component-library/types';
  import InspectorTabContent from '@mathesar/components/InspectorTabContent.svelte';
  import { TabContainer } from '@mathesar-component-library';

  import type { ExplorationInspectorTab } from '../QueryInspector';
  import type QueryManager from '../QueryManager';
  import type { QueryRunner } from '../QueryRunner';

  import CellTab from './cell/CellTab.svelte';
  import ColumnTab from './column-tab/ColumnTab.svelte';
  import ExplorationTab from './ExplorationTab.svelte';

  export let queryHandler: QueryRunner | QueryManager;

  $: ({ inspector, query } = queryHandler);
  $: ({ tabs, activeTab } = inspector);

  function handleTabSelected(e: CustomEvent<{ tab: Tab }>) {
    const tab = e.detail.tab as ExplorationInspectorTab;
    inspector.activate(tab.id);
  }
</script>

<aside class="exploration-inspector">
  <TabContainer
    tabStyle="compact"
    tabs={$tabs}
    activeTab={$activeTab}
    fillTabWidth
    fillContainerHeight
    on:tabSelected={handleTabSelected}
  >
    <InspectorTabContent>
      {#if $activeTab.id === 'exploration'}
        <ExplorationTab
          {queryHandler}
          name={$query.name}
          description={$query.description}
          on:delete
        />
      {:else if $activeTab.id === 'column'}
        <ColumnTab {queryHandler} />
      {:else if $activeTab.id === 'cell'}
        <CellTab {queryHandler} />
      {/if}
    </InspectorTabContent>
  </TabContainer>
</aside>

<style lang="scss">
  .exploration-inspector {
    height: 100%;
    border: 1px solid var(--border-container);
    border-radius: var(--border-radius-l);
    background: var(--surface-supporting);
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
</style>
