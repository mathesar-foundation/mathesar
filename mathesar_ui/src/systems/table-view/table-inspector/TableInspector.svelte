<script lang="ts">
  import ColumnMode from './column/ColumnMode.svelte';

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
        on:click={() => handleTabClick(tab.id)}
        role="button"
        class:is-selected={selectedTab?.id === tab.id}
      >
        {tab.label}
      </span>
    {/each}
  </div>
  <svelte:component this={selectedTab?.component} />
</div>

<style>
  .table-inspector-container {
    width: var(--table-inspector-width, 400px);
    box-shadow: 0px 2px 2px 0px rgba(0, 0, 0, 0.14),
      0px 3px 1px -2px rgba(0, 0, 0, 0.12), 0px 1px 5px 0px rgba(0, 0, 0, 0.2);
    padding: 0.5rem;
  }

  .mode-tabs-container {
    display: flex;
    flex-direction: row;
    gap: 0.5rem;
  }

  .mode-tabs-container > span {
    border: 1px solid rgba(0, 0, 0, 0.2);
    border-radius: 4px;
    padding: 0.15rem 0.25rem;
    flex: 1;
    text-align: center;
    cursor: pointer;
  }

  .mode-tabs-container > span:hover,
  .mode-tabs-container > span.is-selected {
    background-color: rgba(0, 0, 0, 0.12);
  }
</style>
