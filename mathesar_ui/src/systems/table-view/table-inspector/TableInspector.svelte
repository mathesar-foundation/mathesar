<script lang="ts">
  import { _ } from 'svelte-i18n';

  import { TabContainer } from '@mathesar-component-library';
  import type { SheetCellDetails } from '@mathesar/components/sheet/selection';
  import type MessageBus from '@mathesar/utils/MessageBus';
  import CellMode from './cell/CellMode.svelte';
  import ColumnMode from './column/ColumnMode.svelte';
  import RecordMode from './record/RecordMode.svelte';
  import TableMode from './table/TableMode.svelte';

  const tableTab = { label: $_('table'), component: TableMode, id: 1 };
  const columnTab = { label: $_('column'), component: ColumnMode, id: 2 };
  const recordTab = { label: $_('record'), component: RecordMode, id: 3 };
  const cellTab = { label: $_('cell'), component: CellMode, id: 4 };
  const tabs = [tableTab, columnTab, recordTab, cellTab];

  export let cellSelectionStarted: MessageBus<SheetCellDetails> | undefined =
    undefined;

  let activeTab: (typeof tabs)[number];

  $: cellSelectionStarted?.listen((targetCell) => {
    if (targetCell.type === 'column-header-cell') {
      activeTab = columnTab;
    }
    if (targetCell.type === 'row-header-cell') {
      activeTab = recordTab;
    }
  });
</script>

<div class="table-inspector">
  <TabContainer
    bind:activeTab
    {tabs}
    tabStyle="compact"
    fillContainerHeight
    fillTabWidth
  >
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
  .table-inspector {
    height: 100%;
    box-shadow:
      0px 2px 2px 0px rgba(0, 0, 0, 0.14),
      0px 3px 1px -2px rgba(0, 0, 0, 0.12),
      0px 1px 5px 0px rgba(0, 0, 0, 0.2);
    position: relative;
    background-color: var(--sand-100);
    isolation: isolate;

    :global(.collapsible > .collapsible-header > button.btn) {
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
