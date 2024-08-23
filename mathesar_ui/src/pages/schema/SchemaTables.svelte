<script lang="ts">
  import { _ } from 'svelte-i18n';

  import type { Schema } from '@mathesar/api/rpc/schemas';
  import type { Table } from '@mathesar/api/rpc/tables';
  import EntityContainerWithFilterBar from '@mathesar/components/EntityContainerWithFilterBar.svelte';
  import { RichText } from '@mathesar/components/rich-text';
  import type { Database } from '@mathesar/models/Database';

  import CreateNewTableButton from './CreateNewTableButton.svelte';
  import CreateNewTableTutorial from './CreateNewTableTutorial.svelte';
  import TablesList from './TablesList.svelte';

  export let tablesMap: Map<number, Table>;

  export let database: Database;
  export let schema: Schema;

  $: showTutorial = tablesMap.size === 0;

  let tableSearchQuery = '';

  function filterTables(_tablesMap: Map<number, Table>, searchQuery: string) {
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
    <CreateNewTableButton {database} {schema} />
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
      <TablesList tables={filteredTables} {database} {schema} />
    {/if}
  </svelte:fragment>
</EntityContainerWithFilterBar>
