<script lang="ts">
  import { _ } from 'svelte-i18n';

  import type { TableEntry } from '@mathesar/api/rest/types/tables';
  import type { Database, SchemaEntry } from '@mathesar/AppTypes';
  import EntityContainerWithFilterBar from '@mathesar/components/EntityContainerWithFilterBar.svelte';
  import { RichText } from '@mathesar/components/rich-text';

  import CreateNewTableButton from './CreateNewTableButton.svelte';
  import CreateNewTableTutorial from './CreateNewTableTutorial.svelte';
  import TablesList from './TablesList.svelte';

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

<EntityContainerWithFilterBar
  searchPlaceholder={$_('search_tables')}
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
      <RichText
        text={$_('tables_matching_search', {
          values: { count: filteredTables.length },
        })}
        let:slotName
      >
        {#if slotName === 'searchValue'}
          <strong>{tableSearchQuery}</strong>
        {/if}
      </RichText>
    </p>
  </svelte:fragment>
  <svelte:fragment slot="content">
    {#if showTutorial}
      <CreateNewTableTutorial {database} {schema} />
    {:else}
      <TablesList {canExecuteDDL} tables={filteredTables} {database} {schema} />
    {/if}
  </svelte:fragment>
</EntityContainerWithFilterBar>
