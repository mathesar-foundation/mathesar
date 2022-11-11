<script lang="ts">
  import ColumnMode from './column/ColumnMode.svelte';
  import RecordMode from './record/RecordMode.svelte';

  import TableMode from './table/TableMode.svelte';

  const tabs = [
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

  let selectedTabId = 1;
  $: selectedTab = tabs.find((tab) => tab.id === selectedTabId);

  const handleTabClick = (tabId: number) => {
    selectedTabId = tabId;
  };
</script>

<div class="table-inspector-container">
  <div class="mode-tabs-container">
    {#each tabs as tab (tab.id)}
      <span
        class="mode-tab"
        on:click={() => handleTabClick(tab.id)}
        role="button"
        class:is-selected={selectedTab?.id === tab.id}
      >
        {tab.label}
      </span>
    {/each}
  </div>
  {#if selectedTab}
    <div class="tabs-container">
      <svelte:component this={selectedTab.component} />
    </div>
  {/if}
</div>

<style>
  .table-inspector-container {
    width: var(--table-inspector-width, 400px);
    box-shadow: 0px 2px 2px 0px rgba(0, 0, 0, 0.14),
      0px 3px 1px -2px rgba(0, 0, 0, 0.12), 0px 1px 5px 0px rgba(0, 0, 0, 0.2);
    position: relative;
    isolation: isolate;
  }

  .tabs-container {
    position: absolute;
    overflow-y: auto;
    left: 0;
    right: 0;
    bottom: 0;
    top: 20px;
    padding: 0.5rem;
  }

  .mode-tabs-container {
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
  }
</style>
