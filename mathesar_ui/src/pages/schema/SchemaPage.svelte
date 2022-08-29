<script lang="ts">
  import type { Database, SchemaEntry } from '@mathesar/AppTypes';
  import EntityType from '@mathesar/components/EntityType.svelte';
  import QueryName from '@mathesar/components/QueryName.svelte';
  import SchemaName from '@mathesar/components/SchemaName.svelte';
  import TableName from '@mathesar/components/TableName.svelte';
  import LayoutWithHeader from '@mathesar/layouts/LayoutWithHeader.svelte';
  import {
    getTablePageUrl,
    getDataExplorerPageUrl,
    getImportPageUrl,
  } from '@mathesar/routes/urls';
  import { queries } from '@mathesar/stores/queries';
  import { tables as tablesStore } from '@mathesar/stores/tables';

  export let database: Database;
  export let schema: SchemaEntry;

  $: tablesMap = $tablesStore.data;
  $: queriesMap = $queries.data;
</script>

<svelte:head>
  <title>{schema.name} | Mathesar</title>
</svelte:head>

<LayoutWithHeader>
  <div class="schema-page-header">
    <div class="schema-page-name">
      <div><EntityType>Schema</EntityType></div>
      <h1><SchemaName {schema} /></h1>
    </div>
  </div>

  <ul class="actions-list">
    <li class="actions-list-item">
      <a href={getImportPageUrl(database.name, schema.id)}>Import</a>
    </li>
    <li class="actions-list-item">
      <a href={getDataExplorerPageUrl(database.name, schema.id)}
        >New Exploration</a
      >
    </li>
  </ul>

  <div class="entity-list-wrapper">
    <h2 class="entity-list-title">Tables ({[...tablesMap.values()].length})</h2>
    <ul class="entity-list">
      {#each [...tablesMap.values()] as table (table.id)}
        <li class="entity-list-item">
          <a href={getTablePageUrl(database.name, schema.id, table.id)}>
            <TableName {table} />
          </a>
        </li>
      {/each}
    </ul>
  </div>

  <div class="entity-list-wrapper">
    <h2 class="entity-list-title">
      Explorations ({[...queriesMap.values()].length})
    </h2>
    <ul class="entity-list">
      {#each [...queriesMap.values()] as query (query.id)}
        <li class="entity-list-item">
          <a href={getDataExplorerPageUrl(database.name, schema.id, query.id)}>
            <QueryName {query} />
          </a>
        </li>
      {/each}
    </ul>
  </div>
</LayoutWithHeader>

<style lang="scss">
  .schema-page-header {
    margin: 0.5rem 0;
    display: flex;
    align-items: center;
  }
  .schema-page-name {
    flex-grow: 1;
    h1 {
      margin: 0;
      font-weight: 500;
      font-size: var(--display-size-large);
    }
  }
  .entity-list-wrapper {
    display: flex;
    flex-direction: column;

    .entity-list-title {
      font-size: var(--text-size-large);
      margin: 0.5rem 0;
      font-weight: 500;
    }
  }
  .entity-list {
    list-style: none;
    margin: 0;
    padding-left: 0;

    .entity-list-item {
      margin: 0.25rem 0;
    }
    .entity-list-item > a {
      display: inline-block;
      text-decoration: none;
      padding: 0.25rem 0;
      color: var(--color-link);
      font-size: var(--text-size-large);
    }
    .entity-list-item > a:hover {
      text-decoration: underline;
    }
  }
</style>
