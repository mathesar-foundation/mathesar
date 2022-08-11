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
  <div><EntityType>Schema</EntityType></div>
  <h1><SchemaName {schema} /></h1>

  <ul>
    <li>
      <a href={getImportPageUrl(database.name, schema.id)}>Import</a>
    </li>
    <li>
      <a href={getDataExplorerPageUrl(database.name, schema.id)}
        >New Exploration</a
      >
    </li>
  </ul>

  <h2>Tables</h2>
  <ul>
    {#each [...tablesMap.values()] as table (table.id)}
      <li>
        <a href={getTablePageUrl(database.name, schema.id, table.id)}>
          <TableName {table} />
        </a>
      </li>
    {/each}
  </ul>

  <h2>Explorations</h2>
  <ul>
    {#each [...queriesMap.values()] as query (query.id)}
      <li>
        <a href={getDataExplorerPageUrl(database.name, schema.id, query.id)}>
          <QueryName {query} />
        </a>
      </li>
    {/each}
  </ul>
</LayoutWithHeader>
