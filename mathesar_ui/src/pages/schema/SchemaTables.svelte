<script lang="ts">
  import { tick } from 'svelte';
  import { _ } from 'svelte-i18n';

  import EntityContainerWithFilterBar from '@mathesar/components/EntityContainerWithFilterBar.svelte';
  import { RichText } from '@mathesar/components/rich-text';
  import type { Database } from '@mathesar/models/Database';
  import type { Schema } from '@mathesar/models/Schema';
  import type { Table } from '@mathesar/models/Table';

  import CreateNewTableButton from './CreateNewTableButton.svelte';
  import CreateNewTableTutorial from './CreateNewTableTutorial.svelte';
  import TablesList from './TablesList.svelte';

  export let tablesMap: Map<number, Table>;
  export let database: Database;
  export let schema: Schema;
  export let onCreateEmptyTable: () => void;

  $: ({ currentRolePrivileges } = schema.currentAccess);
  $: showTutorial =
    tablesMap.size === 0 && $currentRolePrivileges.has('CREATE');

  let tableSearchQuery = '';
  let highlightingEnabled = true;

  async function momentarilyPauseHighlighting() {
    highlightingEnabled = false;
    await tick();
    highlightingEnabled = true;
  }

  // Don't highlight items when the filter query changes
  $: tableSearchQuery, void momentarilyPauseHighlighting();

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
    <CreateNewTableButton {database} {schema} {onCreateEmptyTable} />
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
      <CreateNewTableTutorial {database} {schema} {onCreateEmptyTable} />
    {:else}
      <TablesList
        tables={filteredTables}
        {database}
        {schema}
        {highlightingEnabled}
      />
    {/if}
  </svelte:fragment>
</EntityContainerWithFilterBar>
