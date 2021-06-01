<script lang="ts">
  import { meta } from 'tinro';
  import { schemas } from '@mathesar/stores/schemas';
  import { Tree, TabContainer } from '@mathesar-components';
  import {
    openTableQuery,
    removeTableQuery,
    getTableQuery,
    getTablesFromQuery,
  } from '@mathesar/utils/routeHandler';
  import type { Schema } from '@mathesar/utils/preloadData';
  import type { Tab } from '@mathesar-components/types';
  import type { SchemaTreeMapEntry } from '@mathesar/stores/schemas';

  const route = meta();
  export let database : string;

  let tabs: Tab[] = getTablesFromQuery(route.query.t).map(
    (entry) => {
      const entryMap = $schemas.entryMap as SchemaTreeMapEntry;
      const schemaTable = entryMap?.get(entry[0]);
      return {
        id: entry[0],
        label: schemaTable?.name,
      };
    },
  );
  let activeTab = tabs[0];

  function getLink(entry: Schema) {
    return `/${database}${getTableQuery(entry.id)}`;
  }

  function tableSelected(e: { detail: { node: Schema, originalEvent: Event, link?: string } }) {
    const { node, originalEvent } = e.detail;
    const { parentElement } = originalEvent.target as Element;
    originalEvent.preventDefault();
    originalEvent.stopPropagation();

    openTableQuery(database, node.id);
    const existingTab = tabs.find((tabEntry) => tabEntry.id === node.id);
    if (existingTab) {
      if (activeTab.id !== existingTab.id) {
        activeTab = existingTab;
      }
    } else {
      const activeTabEntry = {
        id: node.id,
        label: node.name,
      };
      tabs.push(activeTabEntry);
      tabs = ([] as Tab[]).concat(tabs);
      activeTab = activeTabEntry;
    }
    // TODO: Bubble events upwards without a click
    parentElement?.click();
  }

  function tabSelected(e: { detail: { tab: Tab, originalEvent: Event } }) {
    const { originalEvent, tab } = e.detail;
    originalEvent.preventDefault();

    openTableQuery(database, tab.id as string);
  }

  function tabRemoved(e: { detail: { removedTab: Schema, activeTab?: Schema } }) {
    const { removedTab, activeTab: tabActive } = e.detail;
    removeTableQuery(database, removedTab.id, tabActive?.id);
  }
</script>

<aside>
  <nav>
    <Tree data={$schemas.data || []} idKey="id" labelKey="name" childKey="tables" {getLink} on:nodeSelected={tableSelected}/>
  </nav>
</aside>

<section class="table-section">
  {#if tabs?.length > 0}
    <TabContainer bind:tabs bind:activeTab allowRemoval={true} preventDefault={true}
                  {getLink} on:tabSelected={tabSelected} on:tabRemoved={tabRemoved}>
      {JSON.stringify(activeTab)}
    </TabContainer>

  {:else}
    Empty state
  {/if}
</section>

<!-- <ImportFile database={selectedDb}/> -->

<style global lang="scss">
  @import "Base.scss";
</style>
