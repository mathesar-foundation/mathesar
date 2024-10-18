<script lang="ts">
  import type { Tab } from '@mathesar/component-library/types';
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
  </TabContainer>
</aside>

<style lang="scss">
  .exploration-inspector {
    height: 100%;
    border-left: 1px solid var(--slate-300);
    background: var(--sand-100);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    --spacing-y: 0.4em;

    :global(.section-content) {
      padding: var(--size-large);
    }
    :global(.section-content .form) {
      --form-field-spacing: var(--size-large);
    }
    :global(.section-content h1) {
      font-size: var(--text-size-base);
      font-weight: 590;
      margin: 0;
    }
    :global(.section-content .labeled-input .label) {
      font-weight: 590;
    }
    :global(.collapsible > .collapsible-header > button.btn) {
      background-color: var(--sand-200);

      &:hover {
        background-color: var(--sand-300);
      }

      &:active {
        background-color: var(--sand-400);
      }
    }
    :global(
        .collapsible
          > .collapsible-header
          > button.btn
          .collapsible-header-title
      ) {
      font-weight: 590;
    }
    :global(.collapsible .section-content.actions .delete-button) {
      width: 100%;
    }
  }
</style>
