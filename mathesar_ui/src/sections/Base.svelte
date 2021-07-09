<script lang="ts">
  import { schemas } from '@mathesar/stores/schemas';
  import { faTable } from '@fortawesome/free-solid-svg-icons';
  import { Tree, TabContainer, Icon } from '@mathesar-components';
  import URLQueryHandler from '@mathesar/utils/urlQueryHandler';
  import type { Schema } from '@mathesar/utils/preloadData';
  import type { TableMap } from '@mathesar/stores/schemas';
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

  let expandedSchemas = new Set();
  const tableMap = $schemas.tableMap as TableMap;
  URLQueryHandler.getAllTableConfigs(database).forEach(
    (entry) => {
      const schemaTable = tableMap?.get(entry.id);
      if (schemaTable) {
        expandedSchemas.add(schemaTable?.parent);
      }
    },
  );

  const { tabs, activeTab } = getAllTabsForDB(database);
  let activeTable: Set<unknown>;

  function onActiveTabChange(_activeTab: MathesarTab) {
    activeTable = new Set([_activeTab?.id]);
    const schemaTable = tableMap?.get(_activeTab?.id as number);
    if (schemaTable) {
      expandedSchemas.add(schemaTable.parent);
      expandedSchemas = new Set(expandedSchemas);
    }
  }

  $: onActiveTabChange($activeTab);

  function getLink(entry: MathesarTab) {
    if (entry.isNew) {
      return null;
    }
    return `/${database}${URLQueryHandler.constructTableQuery(entry.id as number)}`;
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

<aside>
  <nav>
    <Tree data={$schemas.data || []} idKey="id" labelKey="name" childKey="tables"
          bind:expandedItems={expandedSchemas} search={true} {getLink}
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
