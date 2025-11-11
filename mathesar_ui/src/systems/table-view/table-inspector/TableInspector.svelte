<script lang="ts">
  import { _ } from 'svelte-i18n';

  import type { Tab } from '@mathesar/component-library/types';
  import InspectorTabContent from '@mathesar/components/InspectorTabContent.svelte';
  import {
    RelatedColumn,
    getTabularDataStoreFromContext,
  } from '@mathesar/stores/table-data';
  import { TabContainer, defined } from '@mathesar-component-library';

  import CellMode from './cell/CellMode.svelte';
  import ColumnMode from './column/ColumnMode.svelte';
  import RecordMode from './record/RecordMode.svelte';
  import TableMode from './table/TableMode.svelte';

  const tabularData = getTabularDataStoreFromContext();

  const tabMap = {
    table: { label: $_('table'), component: TableMode },
    column: { label: $_('column'), component: ColumnMode },
    record: { label: $_('record'), component: RecordMode },
    cell: { label: $_('cell'), component: CellMode },
  };

  type TableInspectorTabId = keyof typeof tabMap;

  export let activeTabId: TableInspectorTabId | undefined;

  $: ({ allColumns, selection } = $tabularData);

  // Check if any selected columns are related columns
  $: hasRelatedColumnSelected = (() => {
    const ids = $selection.columnIds;
    for (const id of ids) {
      // Handle both string IDs (related columns) and numeric IDs (real columns)
      const columnId: string | number =
        typeof id === 'string' && id.startsWith('related_')
          ? id
          : parseInt(id, 10);
      const column = $allColumns.get(columnId);
      if (column instanceof RelatedColumn) {
        return true;
      }
    }
    return false;
  })();

  // Filter out column tab if related column is selected
  $: tabs = Object.entries(tabMap)
    .filter(([id]) => {
      if (id === 'column' && hasRelatedColumnSelected) {
        return false;
      }
      return true;
    })
    .map(([id, tab]) => ({ id, ...tab }));

  $: activeTab = defined(activeTabId, (id) => ({ id, ...tabMap[id] }));

  function handleTabSelected(e: CustomEvent<{ tab: Tab }>) {
    activeTabId = e.detail.tab.id as TableInspectorTabId;
  }
</script>

<div class="table-inspector">
  <TabContainer
    {activeTab}
    {tabs}
    tabStyle="compact"
    fillContainerHeight
    fillTabWidth
    on:tabSelected={handleTabSelected}
  >
    {#if activeTab}
      <InspectorTabContent>
        <svelte:component this={activeTab.component} />
      </InspectorTabContent>
    {/if}
  </TabContainer>
</div>

<style lang="scss">
  .table-inspector {
    height: 100%;
    position: relative;
    background-color: var(--color-bg-supporting);
    border: 1px solid;
    border-top-color: var(--color-border-supporting);
    border-left-color: var(--color-border-supporting);
    border-bottom-color: color-mix(
      in srgb,
      var(--color-border-supporting),
      transparent 40%
    );
    border-right-color: color-mix(
      in srgb,
      var(--color-border-supporting),
      transparent 20%
    );
    border-radius: var(--border-radius-l);
    isolation: isolate;
    overflow: hidden;
  }
</style>
