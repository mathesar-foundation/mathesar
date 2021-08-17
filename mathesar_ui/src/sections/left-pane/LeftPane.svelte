<script lang="ts">
  import { faTable } from '@fortawesome/free-solid-svg-icons';
  import {
    Icon,
    Tree,
  } from '@mathesar-components';
  import {
    addTab,
  } from '@mathesar/stores/tabs';
  import type { MathesarTab } from '@mathesar/stores/tabs';
  import type { Schema } from '@mathesar/App.d';
  import type {
    TreeItem,
  } from '@mathesar-components/types';

  export let database: string;
  export let schema: Schema;
  export let activeTab;
  export let getLink: (entry: MathesarTab) => string;
  
  let tree: TreeItem[] = [];
  let activeTable: Set<unknown>;
  const expandedItems = new Set(['table_header']);

  function generateTree(_schema: Schema) {
    const tableHeader = {
      id: 'table_header',
      name: 'Tables',
      tables: [],
    };
    _schema.tables?.forEach((value) => {
      tableHeader.tables.push(value);
    });
    return [tableHeader];
  }

  $: tree = generateTree(schema);

  function onActiveTabChange(_activeTab: MathesarTab) {
    activeTable = new Set([_activeTab?.id]);
  }

  $: onActiveTabChange(activeTab);

  function tableSelected(e: { detail: { node: Schema, originalEvent: Event, link?: string } }) {
    const { node, originalEvent } = e.detail;
    originalEvent.preventDefault();

    addTab(database, schema.id, {
      id: node.id,
      label: node.name,
    });
  }
</script>

<aside>
  <nav>
    <Tree data={tree} idKey="id" labelKey="name" childKey="tables"
          search={true} {getLink} {expandedItems}
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

<style global lang="scss">
  @import "LeftPane.scss";
</style>
