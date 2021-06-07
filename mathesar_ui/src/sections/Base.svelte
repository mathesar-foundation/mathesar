<script lang="ts">
  import { onDestroy } from 'svelte';
  import { meta } from 'tinro';
  import { schemas } from '@mathesar/stores/schemas';
  import { faTable } from '@fortawesome/free-solid-svg-icons';
  import { Tree, TabContainer, Icon } from '@mathesar-components';
  import {
    openTableQuery,
    removeTableQuery,
    getTableQuery,
    getTablesFromQuery,
    removeActiveTableQuery,
  } from '@mathesar/utils/routeHandler';
  import type { Schema } from '@mathesar/utils/preloadData';
  import type { Tab } from '@mathesar-components/types';
  import type { SchemaTreeMapEntry } from '@mathesar/stores/schemas';
  import {
    getAllImportDetails,
    getDBStore,
    ImportChangeType,
    removeImport,
  } from '@mathesar/stores/fileImports';
  import { clearTable } from '@mathesar/stores/tableData';

  import ImportFile from './import-file/ImportFile.svelte';
  import TableView from './table-view/TableView.svelte';

  const route = meta();
  export let database : string;

  const tables: Tab[] = getTablesFromQuery(route.query.t).map(
    (entry) => {
      const entryMap = $schemas.entryMap as SchemaTreeMapEntry;
      const schemaTable = entryMap?.get(entry[0]);
      return {
        id: entry[0],
        label: schemaTable?.name,
      };
    },
  );
  let tabs: Tab[] = (getAllImportDetails(database) as unknown as Tab[]).concat(tables);
  let activeTab = tables.find(
    (table) => table.id?.toString() === decodeURIComponent(route.query.a),
  ) || tabs[0];

  const unsubFileImports = getDBStore(database).changes.subscribe((fileImportInfo) => {
    if (fileImportInfo) {
      if (fileImportInfo.changeType === ImportChangeType.ADDED) {
        const newImportTab = {
          ...fileImportInfo.info,
          label: 'New import',
          isNew: true,
        };
        tabs = [
          ...tabs,
          newImportTab,
        ];
        activeTab = newImportTab;
      }
    }
  });

  onDestroy(() => {
    unsubFileImports();
  });

  function getLink(entry: Tab) {
    if (entry.isNew) {
      return null;
    }
    return `/${database}${getTableQuery(entry.id as string)}`;
  }

  function tableSelected(e: { detail: { node: Schema, originalEvent: Event, link?: string } }) {
    const { node, originalEvent } = e.detail;
    originalEvent.preventDefault();

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
  }

  function tabSelected(e: { detail: { tab: Tab, originalEvent: Event } }) {
    const { originalEvent, tab } = e.detail;
    originalEvent.preventDefault();

    if (tab.isNew) {
      removeActiveTableQuery(database);
    } else {
      openTableQuery(database, tab.id as string);
    }
  }

  function tabRemoved(e: { detail: { removedTab: Tab, activeTab?: Tab } }) {
    const { removedTab, activeTab: tabActive } = e.detail;
    if (activeTab?.isNew) {
      removeActiveTableQuery(database);
    }
    if (removedTab.isNew) {
      removeImport(database, removedTab.id as string);
    } else {
      removeTableQuery(database, removedTab.id as string, tabActive?.id as string);
      clearTable(database, removedTab.id as string);
    }
  }
</script>

<aside>
  <nav>
    <Tree data={$schemas.data || []} idKey="id" labelKey="name" childKey="tables"
          {getLink} on:nodeSelected={tableSelected} let:entry>
        <Icon data={faTable}/>
        <span>{entry.name}</span>
    </Tree>
  </nav>
</aside>

<section class="table-section">
  {#if tabs?.length > 0}
    <TabContainer bind:tabs bind:activeTab allowRemoval={true} preventDefault={true}
                  {getLink} on:tabSelected={tabSelected} on:tabRemoved={tabRemoved}>
      <span slot="tab" let:tab>
        <Icon data={faTable}/>
        <span>{tab.label}</span>
      </span>

      {#if activeTab}
        {#if activeTab.isNew}
          <ImportFile {database} id={activeTab.id?.toString()}/>
        {:else}
          <TableView {database} id={activeTab.id?.toString()}/>
        {/if}
      {/if}
    </TabContainer>

  {:else}
    Empty state
  {/if}
</section>

<style global lang="scss">
  @import "Base.scss";
</style>
