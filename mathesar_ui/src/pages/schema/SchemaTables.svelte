<script lang="ts">
  import type { TableEntry } from '@mathesar/api/types/tables';
  import type { Database, SchemaEntry } from '@mathesar/AppTypes';
  import { labeledCount } from '@mathesar/utils/languageUtils';
  import TablesList from './TablesList.svelte';
  import EntityLayout from './EntityLayout.svelte';
  import CreateNewTableTutorial from './CreateNewTableTutorial.svelte';
  import CreateNewTableButton from './CreateNewTableButton.svelte';

  export let tablesMap: Map<number, TableEntry>;

  export let database: Database;
  export let schema: SchemaEntry;
  export let canExecuteDDL: boolean;

  $: showTutorial = tablesMap.size === 0 && canExecuteDDL;

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
  searchPlaceholder="Search Tables"
  bind:searchQuery={tableSearchQuery}
  on:clear={clearQuery}
>
  <svelte:fragment slot="action">
    {#if canExecuteDDL}
      <CreateNewTableButton {database} {schema} />
    {/if}
  </svelte:fragment>
  <svelte:fragment slot="resultInfo">
    <p>
      {labeledCount(filteredTables, 'results')}
      for all tables matching
      <strong>{tableSearchQuery}</strong>
    </p>
  </svelte:fragment>
  <svelte:fragment slot="content">
    {#if showTutorial}
      <CreateNewTableTutorial {database} {schema} />
    {:else}
      <TablesList {canExecuteDDL} tables={filteredTables} {database} {schema} />
    {/if}
  </svelte:fragment>
</EntityLayout>
