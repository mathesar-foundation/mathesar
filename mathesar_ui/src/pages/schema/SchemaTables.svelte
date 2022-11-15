<script lang="ts">
  import type { TableEntry } from '@mathesar/api/tables';
  import type { Database, SchemaEntry } from '@mathesar/AppTypes';
  import TablesList from './TablesList.svelte';
  import EntityLayout from './EntityLayout.svelte';
  import CreateNewTableTutorial from './CreateNewTableTutorial.svelte';
  import CreateNewTableButton from './CreateNewTableButton.svelte';

  export let tablesMap: Map<number, TableEntry>;

  export let database: Database;
  export let schema: SchemaEntry;

  let tableSearchQuery = '';

  function filterTables(
    _tablesMap: Map<number, TableEntry>,
    searchQuery: string,
  ) {
    return [..._tablesMap.values()].filter((table) =>
      table.name.toLowerCase().includes(searchQuery.trim().toLowerCase()),
    );
  }

  $: filteredTables = filterTables(tablesMap, tableSearchQuery);

  function clearQuery() {
    tableSearchQuery = '';
  }
</script>

<EntityLayout
  searchPlaceholder="Search Table"
  bind:searchQuery={tableSearchQuery}
  on:clear={clearQuery}
>
  <slot slot="action">
    <CreateNewTableButton {database} {schema} />
  </slot>
  <slot slot="resultInfo">
    {#if filteredTables.length}
      <p>
        {filteredTables.length} result{filteredTables.length > 1 ? 's' : ''} for
        all table{filteredTables.length > 1 ? 's' : ''} matching
        <strong>{tableSearchQuery}</strong>
      </p>
    {:else}
      <p>
        0 results for all table{filteredTables.length > 1 ? 's' : ''} matching
        <strong>{tableSearchQuery}</strong>
      </p>
    {/if}
  </slot>
  <slot slot="content">
    {#if tablesMap.size}
      <TablesList tables={filteredTables} {database} {schema} />
    {:else}
      <CreateNewTableTutorial {database} {schema} />
    {/if}
  </slot>
</EntityLayout>
