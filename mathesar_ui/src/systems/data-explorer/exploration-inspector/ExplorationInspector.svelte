<script lang="ts">
  import { TabContainer } from '@mathesar-component-library';
  import type QueryRunner from '../QueryRunner';
  import type QueryManager from '../QueryManager';
  import ExplorationTab from './ExplorationTab.svelte';
  import ColumnTab from './ColumnTab.svelte';
  import CellTab from './CellTab.svelte';

  export let queryHandler: QueryRunner | QueryManager;
  $: ({ query } = queryHandler);
  $: isSaved = $query.isSaved();

  const generalTabs = [
    { id: 'inspect-column', label: 'Column' },
    { id: 'inspect-cell', label: 'Cell' },
  ];
  const tabsWhenQueryIsSaved = [
    { id: 'inspect-exploration', label: 'Exploration' },
    ...generalTabs,
  ];
  $: tabs = isSaved ? tabsWhenQueryIsSaved : generalTabs;
</script>

<aside class="exploration-inspector">
  <TabContainer {tabs} fillTabWidth fillContainerHeight let:activeTab>
    {#if activeTab.id === 'inspect-exploration'}
      <ExplorationTab
        {queryHandler}
        name={$query.name}
        description={$query.description}
        on:delete
      />
    {:else if activeTab.id === 'inspect-column'}
      <ColumnTab />
    {:else}
      <CellTab />
    {/if}
  </TabContainer>
</aside>

<style lang="scss">
  aside.exploration-inspector {
    width: var(--exploration-inspector-width);
    flex-basis: var(--exploration-inspector-width);
    border-left: 1px solid var(--slate-300);
    background: var(--sand-100);
    flex-shrink: 0;
    flex-grow: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;

    :global(.collapsible > button.btn) {
      background-color: var(--sand-200);

      &:hover {
        background-color: var(--sand-300);
      }

      &:active {
        background-color: var(--sand-400);
      }
    }
    :global(.collapsible > button.btn .collapsible-header-title) {
      font-weight: 590;
    }
  }
</style>
