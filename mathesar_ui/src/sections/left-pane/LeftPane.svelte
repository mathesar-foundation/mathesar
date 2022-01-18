<script lang="ts">
  import { get } from 'svelte/store';
  import { faTable } from '@fortawesome/free-solid-svg-icons';
  import {
    Icon,
    Tree,
  } from '@mathesar-component-library';
  import {
    getTabsForSchema,
    constructTabularTab,
    constructImportTab,
  } from '@mathesar/stores/tabs';
  import {
    tables,
  } from '@mathesar/stores/tables';
  import {
    loadIncompleteImport,
  } from '@mathesar/stores/fileImports';

  import type {
    DBTablesStoreData,
  } from '@mathesar/stores/tables';
  import type { MathesarTab } from '@mathesar/stores/tabs/types';
  import type { SchemaEntry, TableEntry } from '@mathesar/App.d';
  import { TabularType } from '@mathesar/App.d';
  import type {
    TreeItem,
  } from '@mathesar-component-library/types';

  export let database: string;
  export let schemaId: SchemaEntry['id'];
  export let activeTab: MathesarTab | undefined = undefined;
  export let getLink: (entry: TableEntry) => string;
  
  let tree: TreeItem[] = [];
  let activeOptionSet: Set<unknown>;
  const expandedItems = new Set(['table_header']);

  function generateTree(_tables: DBTablesStoreData) {
    const tableHeader = {
      treeId: 'table_header',
      id: 't_h',
      label: 'Tables',
      tables: [] as (TableEntry & TreeItem)[],
    };

    _tables?.data?.forEach((value) => {
      const tableInfo: TableEntry & TreeItem = {
        ...value,
        label: value.name,
        treeId: value.id,
      };
      if (value.import_verified === false) {
        tableInfo.label += '*';
        tableInfo.treeId = `_existing_${value.id}`;
      }
      tableHeader.tables.push(tableInfo);
    });
    return [tableHeader];
  }

  $: tree = generateTree($tables);

  function onActiveTabChange(_activeTab: MathesarTab | undefined) {
    if (_activeTab?.tabularData) {
      activeOptionSet = new Set([
        _activeTab.tabularData.id,
      ]);
    } else {
      activeOptionSet = new Set();
    }
  }

  $: onActiveTabChange(activeTab);

  function tableSelected(e: { detail: { node: TableEntry, originalEvent: Event, link?: string } }) {
    const { node, originalEvent } = e.detail;
    originalEvent.preventDefault();

    const tabList = getTabsForSchema(database, schemaId);
    if (node.import_verified === false) {
      const fileImport = loadIncompleteImport(database, schemaId, node);
      const tab = constructImportTab(get(fileImport).id);
      tabList.add(tab);
    } else {
      const tab = constructTabularTab(TabularType.Table, node.id, node.name);
      tabList.add(tab);
    }
  }
</script>

<aside>
  <nav>
    <Tree data={tree} idKey="treeId" childKey="tables"
          search={true} {getLink} {expandedItems}
          bind:selectedItems={activeOptionSet} on:nodeSelected={tableSelected}
          let:entry>
      <Icon data={faTable}/>
      <span>{entry.label}</span>

      <svelte:fragment slot="empty">
        No tables found
      </svelte:fragment>
    </Tree>
  </nav>
</aside>

<style global lang="scss">
  @import "LeftPane.scss";
</style>
