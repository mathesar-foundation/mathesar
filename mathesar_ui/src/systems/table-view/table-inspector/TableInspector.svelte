<script lang="ts">
  import { TabContainer } from '@mathesar/component-library';
  import { getTabularDataStoreFromContext } from '@mathesar/stores/table-data';
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

  const tabularData = getTabularDataStoreFromContext();
  $: ({ selection } = $tabularData);
  $: ({ selectedCells } = selection);

  $: {
    // Explicit dependency
    $selectedCells;

    if (selection.isAnyColumnCompletelySelected()) {
      [, activeTab] = tabs;
    }

    if (selection.isAnyRowCompletelySelected()) {
      [, , activeTab] = tabs;
    }
  }
</script>

<div class="table-inspector-container">
  <TabContainer bind:activeTab {tabs} tabStyle='compact' fillContainerHeight fillTabWidth>
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
    width: var(--table-inspector-width, 400px);
    box-shadow: 0px 2px 2px 0px rgba(0, 0, 0, 0.14),
      0px 3px 1px -2px rgba(0, 0, 0, 0.12), 0px 1px 5px 0px rgba(0, 0, 0, 0.2);
    position: relative;
    background-color: var(--sand-100);
    isolation: isolate;

    :global(.collapsible > button.btn) {
      background-color: var(--sand-200);

      &:hover {
        background-color: var(--sand-300);
      }

      &:active {
        background-color: var(--sand-400);
      }
    }
  }
</style>
