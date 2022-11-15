<script lang="ts">
  import { TabContainer } from '@mathesar/component-library';
  import type { ComponentType } from 'svelte';
  import ColumnMode from './column/ColumnMode.svelte';
  import RecordMode from './record/RecordMode.svelte';

  import TableMode from './table/TableMode.svelte';

  type TabItem = { label: string; id: number; component: ComponentType };
  const tabs: TabItem[] = [
    {
      label: 'Table',
      component: TableMode,
      id: 1,
    },
    {
      label: 'Column',
      component: ColumnMode,
      id: 2,
    },
    {
      label: 'Record',
      component: RecordMode,
      id: 3,
    },
  ];

  let activeTab: TabItem;
</script>

<div class="table-inspector-container">
  <TabContainer bind:activeTab {tabs}>
    <slot>
      {#if activeTab}
        <div class="tabs-container">
          <svelte:component this={activeTab.component} />
        </div>
      {/if}
    </slot>
  </TabContainer>
</div>

<style lang="scss">
  .table-inspector-container {
    --collapsible-header-background-color: var(--sand-200);
    width: var(--table-inspector-width, 400px);
    box-shadow: 0px 2px 2px 0px rgba(0, 0, 0, 0.14),
      0px 3px 1px -2px rgba(0, 0, 0, 0.12), 0px 1px 5px 0px rgba(0, 0, 0, 0.2);
    position: relative;
    background-color: var(--unknown-color-ask-ghislaine);

    // TODO: Make the tabs fixed and the inner content scrollable
    // TODO: Generalise the TabContainer component to account for below CSS
    :global(li.tab) {
      flex: 1;
    }

    :global(.tabs) {
      margin-bottom: 0;
    }

    :global(li.tab > div) {
      text-align: center;
      margin: auto;
    }

    :global(.tabs-container) {
      left: 0;
      right: 0;
      bottom: 0;
    }
    isolation: isolate;
  }

  /* .tabs-container {
    position: absolute;
    overflow-y: auto;
    left: 0;
    right: 0;
    bottom: 0;
    top: 20px;
    padding: 0.5rem;
  } */

  /* .mode-tabs-container {
    display: flex;
    flex-direction: row;
    gap: 0.5rem;
    z-index: 1;
    position: relative;
    background: white;
    padding: 0.5rem;
  }

  .mode-tab {
    border: 1px solid rgba(0, 0, 0, 0.2);
    border-radius: 4px;
    padding: 0.15rem 0.25rem;
    flex: 1;
    text-align: center;
    cursor: pointer;
  }

  .mode-tab:hover,
  .mode-tab.is-selected {
    background-color: rgba(0, 0, 0, 0.12);
  } */
</style>
