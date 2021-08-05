<script lang="ts">
  import { faTable } from '@fortawesome/free-solid-svg-icons';
  import {
    Tree,
    TabContainer,
    Icon,
  } from '@mathesar-components';
  import URLQueryHandler from '@mathesar/utils/urlQueryHandler';
  import { selectedSchema } from '@mathesar/stores/schemas';
  import type { Schema } from '@mathesar/App.d';
  import {
    getAllTabsForDB,
    addTab,
    removeTab,
    selectTab,
  } from '@mathesar/stores/tabs';
  import type { MathesarTab } from '@mathesar/stores/tabs';

  import NewTable from './new-table/NewTable.svelte';
  import TableView from './table-view/TableView.svelte';
  import EmptyState from './empty-state/EmptyState.svelte';

  export let database : string;

  const { tabs, activeTab } = getAllTabsForDB(database);
  let activeTable: Set<unknown>;

  function onActiveTabChange(_activeTab: MathesarTab) {
    activeTable = new Set([_activeTab?.id]);
  }

  $: onActiveTabChange($activeTab);

  function getLink(entry: MathesarTab) {
    if (entry.isNew) {
      return null;
    }
    return `/${database}${URLQueryHandler.constructTableLink(entry.id as number)}`;
  }

  function tableSelected(e: { detail: { node: Schema, originalEvent: Event, link?: string } }) {
    const { node, originalEvent } = e.detail;
    originalEvent.preventDefault();

    addTab(database, {
      id: node.id,
      label: node.name,
    });
  }

  function tabSelected(e: { detail: { tab: MathesarTab, originalEvent: Event } }) {
    const { originalEvent, tab } = e.detail;
    originalEvent.preventDefault();

    selectTab(database, tab);
  }

  function tabRemoved(e: { detail: { removedTab: MathesarTab, activeTab?: MathesarTab } }) {
    removeTab(database, e.detail.removedTab, e.detail.activeTab);
  }
</script>

<svelte:head>
  <title>Mathesar - {$activeTab?.label || 'Home'}</title>
</svelte:head>

{#if $selectedSchema}
  <aside>
    <nav>
      <Tree data={[$selectedSchema]} idKey="id" labelKey="name" childKey="tables"
            search={true} {getLink} expandedItems={new Set([$selectedSchema.id])}
            bind:selectedItems={activeTable} on:nodeSelected={tableSelected}
            let:entry>
          <Icon data={faTable}/>
          <span>{entry.name}</span>

          <svelte:fragment slot="empty">
            No tables found
          </svelte:fragment>
      </Tree>
    </nav>
  </aside>
{/if}

<section class="table-section">
  {#if $tabs?.length > 0}
    <TabContainer bind:tabs={$tabs} bind:activeTab={$activeTab}
                  allowRemoval={true} preventDefault={true} {getLink}
                  on:tabSelected={tabSelected} on:tabRemoved={tabRemoved}>
      <span slot="tab" let:tab>
        <Icon data={faTable}/>
        <span>{tab.label}</span>
      </span>

      {#if $activeTab}
        {#if $activeTab.isNew}
          <NewTable {database} id={$activeTab.id}/>
        {:else}
          <TableView {database} id={$activeTab.id}/>
        {/if}
      {/if}
    </TabContainer>

  {:else}
    <EmptyState/>
  {/if}
</section>

<style global lang="scss">
  @import "Base.scss";
</style>
