<script lang="ts">
  import { _ } from 'svelte-i18n';

  import type { Tab } from '@mathesar/component-library/types';
  import InspectorTabContent from '@mathesar/components/InspectorTabContent.svelte';
  import type { Table } from '@mathesar/models/Table';
  import { isTableView } from '@mathesar/utils/tables';
  import { TabContainer, defined } from '@mathesar-component-library';

  import CellMode from './cell/CellMode.svelte';
  import ColumnMode from './column/ColumnMode.svelte';
  import RecordMode from './record/RecordMode.svelte';
  import TableMode from './table/TableMode.svelte';

  export let activeTabId: TableInspectorTabId | undefined;
  export let table: Table;

  $: isView = isTableView(table);
  const tabMap = {
    table: {
      label: $_('table'),
      component: TableMode,
    },
    column: { label: $_('column'), component: ColumnMode },
    record: { label: $_('record'), component: RecordMode },
    cell: { label: $_('cell'), component: CellMode },
  };
  const viewMap = {
    table: {
      label: $_('view'),
      component: TableMode,
    },
    column: tabMap.column,
    cell: tabMap.cell,
  };
  $: inspectorMap = isView ? viewMap : tabMap;

  type TableInspectorTabId = 'table' | 'column' | 'record' | 'cell';

  $: tabs = Object.entries(inspectorMap).map(([id, tab]) => ({ id, ...tab }));
  $: activeTab = tabs.find((entry) => entry.id === activeTabId);

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
