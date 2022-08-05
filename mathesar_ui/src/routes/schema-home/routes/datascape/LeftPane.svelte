<script lang="ts">
  import { get } from 'svelte/store';
  import { router } from 'tinro';
  import { Icon, Tree } from '@mathesar-component-library';
  import {
    getTabsForSchema,
    constructTabularTab,
    constructImportTab,
    TabType,
  } from '@mathesar/stores/tabs';
  import { tables } from '@mathesar/stores/tables';
  import { queries } from '@mathesar/stores/queries';
  import { loadIncompleteImport } from '@mathesar/stores/fileImports';
  import { constructTabularTabLink } from '@mathesar/stores/tabs/tabDataSaver';

  import type { DBTablesStoreData } from '@mathesar/stores/tables';
  import type { QueriesStoreSubstance } from '@mathesar/stores/queries';
  import type { MathesarTab } from '@mathesar/stores/tabs/types';
  import type { SchemaEntry } from '@mathesar/AppTypes';
  import type { TableEntry } from '@mathesar/api/tables/tableList';
  import { TabularType } from '@mathesar/stores/table-data';
  import type { QueryInstance } from '@mathesar/api/queries/queryList';
  import { iconTable } from '@mathesar/icons';

  export let database: string;
  export let schemaId: SchemaEntry['id'];
  export let activeTab: MathesarTab | undefined = undefined;

  let activeOptionSet: Set<unknown>;
  const expandedItems = new Set(['table_header']);

  interface BaseTreeEntry {
    treeId: string;
    children?: TreeEntry[];
  }
  interface QueryTreeEntry extends BaseTreeEntry {
    type: 'query';
    value: QueryInstance;
  }
  interface TableTreeEntry extends BaseTreeEntry {
    type: 'table';
    value: TableEntry;
  }
  interface HeaderEntry extends BaseTreeEntry {
    type: 'header';
    value: string;
  }
  type TreeEntry = HeaderEntry | TableTreeEntry | QueryTreeEntry;

  function generateTree(
    _tables: DBTablesStoreData,
    _queries: QueriesStoreSubstance,
  ): TreeEntry[] {
    const tableHeader: HeaderEntry = {
      treeId: 'table_header',
      type: 'header',
      value: 'Tables',
      children: [],
    };
    const queryHeader: HeaderEntry = {
      treeId: 'query_header',
      type: 'header',
      value: 'Queries',
      children: [],
    };

    _tables?.data?.forEach((value) => {
      const tableInfo: TableTreeEntry = {
        treeId: `t_${value.id}`,
        type: 'table',
        value,
      };
      tableHeader.children?.push(tableInfo);
    });

    _queries?.data?.forEach((value) => {
      const queryInfo: QueryTreeEntry = {
        treeId: `q_${value.id}`,
        type: 'query',
        value,
      };
      queryHeader.children?.push(queryInfo);
    });
    return [tableHeader, queryHeader];
  }

  $: tree = generateTree($tables, $queries);

  function getEntryLabel(entry: TreeEntry): string {
    if (typeof entry.value === 'string') {
      return entry.value;
    }
    if (entry.type === 'table' && entry.value.import_verified === false) {
      return `${entry.value.name}*`;
    }
    return entry.value.name;
  }

  function onActiveTabChange(_activeTab: MathesarTab | undefined) {
    if (_activeTab && _activeTab.type === TabType.Tabular) {
      activeOptionSet = new Set([`t_${_activeTab.tabularData.id}`]);
    } else {
      activeOptionSet = new Set();
    }
  }

  $: onActiveTabChange(activeTab);

  function getLink(entry: TreeEntry) {
    if (entry.type === 'table') {
      return constructTabularTabLink(
        database,
        schemaId,
        TabularType.Table,
        entry.value.id,
      );
    }
    if (entry.type === 'query') {
      return `/${database}/${schemaId}/queries/${entry.value.id}/`;
    }
    return undefined;
  }

  function onNodeSelection(e: {
    detail: { node: TreeEntry; originalEvent: Event; link?: string };
  }) {
    const { node, originalEvent, link } = e.detail;
    if (node.type === 'header') {
      return;
    }
    originalEvent.preventDefault();
    if (node.type === 'table') {
      const tabList = getTabsForSchema(database, schemaId);
      if (node.value.import_verified === false) {
        const fileImport = loadIncompleteImport(database, schemaId, node.value);
        const tab = constructImportTab(get(fileImport).id);
        tabList.add(tab);
      } else {
        const tab = constructTabularTab(
          TabularType.Table,
          node.value.id,
          node.value.name,
        );
        tabList.add(tab);
      }
      return;
    }
    if (link) {
      router.goto(link);
    }
  }
</script>

<aside id="sidebar">
  <nav>
    <Tree
      data={tree}
      getId={(e) => e.treeId}
      getLabel={getEntryLabel}
      getAndSetChildren={{
        get: (e) => e.children,
        set: (e, value) => ({ ...e, children: value }),
      }}
      search={true}
      {getLink}
      {expandedItems}
      bind:selectedItems={activeOptionSet}
      on:nodeSelected={onNodeSelection}
      let:entry
    >
      <Icon {...iconTable} />
      <span>{getEntryLabel(entry)}</span>

      <svelte:fragment slot="empty">No results found</svelte:fragment>
    </Tree>
  </nav>
</aside>

<style lang="scss">
  aside {
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    border-right: 1px solid #dfdfdf;
    transition: left 0.2s ease-out;
    z-index: 3;
    overflow-y: auto;
    width: var(--side-bar-width);

    nav {
      margin: 15px 0;

      .tree {
        li {
          a.item {
            span {
              margin-left: 6px;
            }
          }
        }
      }
    }
  }
</style>
