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
  <div class="homepage-header">
    <div class="homepage-heading">
      <div><EntityType>Schema</EntityType></div>
      <h1><SchemaName {schema} /></h1>
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
  </div>

  <div class="homepage-wrapper">
    <h2 class="homepage-title">
      Explorations ({[...queriesMap.values()].length})
    </h2>
    <ul class="homepage-list">
      {#each [...queriesMap.values()] as query (query.id)}
        <li class="homepage-list-item">
          <a href={getDataExplorerPageUrl(database.name, schema.id, query.id)}>
            <QueryName {query} />
          </a>
        </li>
      {/each}
    </ul>
  </div>

  <div class="homepage-wrapper">
    <h2 class="homepage-title">Tables ({[...tablesMap.values()].length})</h2>
    <ul class="homepage-list">
      {#each [...tablesMap.values()] as table (table.id)}
        <li class="homepage-list-item">
          <a href={getTablePageUrl(database.name, schema.id, table.id)}>
            <TableName {table} />
          </a>
        </li>
      {/each}
    </ul>
  </div>
</LayoutWithHeader>

<style lang="scss">
  .homepage-header {
    margin: 0.5rem 0;
    display: flex;
    align-items: center;
  }
  .homepage-heading {
    flex-grow: 1;
    h1 {
      margin: 0;
      font-weight: 500;
    }
  }
  .homepage-wrapper {
    display: flex;
    flex-direction: column;

    .homepage-title {
      font-size: var(--text-size-large);
      margin: 0.5rem 0;
      font-weight: 500;
    }
  }
  .homepage-list {
    list-style: none;
    border: 1px solid blue;
    margin: 0;
    padding-left: 0;
    
    .homepage-list-item {
      border: 1px solid red;
    }
    .homepage-list-item > a {
      display: block;
      padding: 0.25rem;
      border: 1px solid green;
    }
  }
</style>
