<script lang="ts">
  import { meta } from 'tinro';
  import { schemas } from '@mathesar/api/schemas';
  import { Tree, TabContainer } from '@mathesar-components';
  import {
    setOpenTableQuery,
    getTableQuery,
    getTablesFromQuery,
  } from '@mathesar/utils/routeHandler';
  import type { Schema } from '@mathesar/utils/preloadData';
  import type { Tab } from '@mathesar-components/types';
  import type { SchemaTreeMapEntry } from '@mathesar/api/schemas';

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

  function tableSelected(e: { detail: { entry: Schema, originalEvent: Event, link?: string } }) {
    const { entry, originalEvent } = e.detail;
    const { parentElement } = originalEvent.target as Element;
    originalEvent.preventDefault();
    originalEvent.stopPropagation();

    setOpenTableQuery(database, entry.id);
    const existingTab = tabs.find((tabEntry) => tabEntry.id === entry.id);
    if (existingTab) {
      if (activeTab.id !== existingTab.id) {
        activeTab = existingTab;
      }
    } else {
      const activeTabEntry = {
        id: entry.id,
        label: entry.name,
      };
      tabs.push(activeTabEntry);
      tabs = ([] as Tab[]).concat(tabs);
      activeTab = activeTabEntry;
    }

    parentElement?.click();
  }
</script>

<aside>
  <nav>
    <Tree data={$schemas.data || []} idKey="id" labelKey="name" childKey="tables" {getLink} on:nodeSelected={tableSelected}/>
  </nav>
</aside>

<section class="table-section">
  <TabContainer tabs={tabs} {activeTab} allowRemoval={true}>
    {#if activeTab}
      {JSON.stringify(activeTab)}
    {:else}
      Empty state
    {/if}
  </TabContainer>
</section>

<!-- <ImportFile database={selectedDb}/> -->

<style global lang="scss">
  @import "Base.scss";
</style>
