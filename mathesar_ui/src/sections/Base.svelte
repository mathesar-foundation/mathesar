<script lang="ts">
  import { onDestroy } from 'svelte';
  import { schemas } from '@mathesar/stores/schemas';
  import { faTable } from '@fortawesome/free-solid-svg-icons';
  import { Tree, TabContainer, Icon } from '@mathesar-components';
  import URLQueryHandler from '@mathesar/utils/urlQueryHandler';
  import type { Schema } from '@mathesar/utils/preloadData';
  import type { Tab } from '@mathesar-components/types';
  import type { TableMap } from '@mathesar/stores/schemas';
  import {
    getAllImportDetails,
    getDBStore,
    ImportChangeType,
    removeImport,
  } from '@mathesar/stores/fileImports';
  import { clearTable } from '@mathesar/stores/tableData';

  import ImportFile from './import-file/ImportFile.svelte';
  import TableView from './table-view/TableView.svelte';
  import EmptyState from './empty-state/EmptyState.svelte';

  export let database : string;

  let expandedSchemas = new Set();
  const tableMap = $schemas.tableMap as TableMap;
  const tables: Tab[] = URLQueryHandler.getAllTableConfigs(database).map(
    (entry) => {
      const schemaTable = tableMap?.get(entry.id);
      expandedSchemas.add(schemaTable?.parent);
      return {
        id: entry.id,
        label: schemaTable?.name,
      };
    },
  );
  let tabs: Tab[] = (getAllImportDetails(database) as unknown as Tab[]).concat(tables);
  let activeTab = tables.find(
    (table) => table.id === URLQueryHandler.getActiveTable(database),
  ) || tabs[0];

  let activeTable;

  function onActiveTabChange(_activeTab: Tab) {
    activeTable = new Set([_activeTab?.id]);
    const schemaTable = tableMap?.get(_activeTab?.id as number);
    if (schemaTable) {
      expandedSchemas.add(schemaTable.parent);
      expandedSchemas = new Set(expandedSchemas);
    }
  }

  $: onActiveTabChange(activeTab);

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
    return `/${database}${URLQueryHandler.constructTableQuery(entry.id as number)}`;
  }

  function tableSelected(e: { detail: { node: Schema, originalEvent: Event, link?: string } }) {
    const { node, originalEvent } = e.detail;
    originalEvent.preventDefault();

    URLQueryHandler.addTable(database, node.id);
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
      URLQueryHandler.removeActiveTable(database);
    } else {
      URLQueryHandler.addTable(database, tab.id as number);
    }
  }

  function tabRemoved(e: { detail: { removedTab: Tab, activeTab?: Tab } }) {
    const { removedTab, activeTab: tabActive } = e.detail;
    if (activeTab?.isNew) {
      URLQueryHandler.removeActiveTable(database);
    }
    if (removedTab.isNew) {
      removeImport(database, removedTab.id as string);
    } else {
      URLQueryHandler.removeTable(database, removedTab.id as number, tabActive?.id as number);
      clearTable(database, removedTab.id as number);
    }
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
  {#if tabs?.length > 0}
    <TabContainer bind:tabs bind:activeTab allowRemoval={true} preventDefault={true}
                  {getLink} on:tabSelected={tabSelected} on:tabRemoved={tabRemoved}>
      <span slot="tab" let:tab>
        <Icon data={faTable}/>
        <span>{tab.label}</span>
      </span>

      {#if activeTab}
        {#if activeTab.isNew}
          <ImportFile {database} id={activeTab.id.toString()}/>
        {:else}
          <TableView {database} id={activeTab.id}/>
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
