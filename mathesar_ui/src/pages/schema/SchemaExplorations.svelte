<script lang="ts">
  import { getDataExplorerPageUrl } from '@mathesar/routes/urls';
  import type { Database, SchemaEntry } from '@mathesar/AppTypes';
  import AnchorButton from '@mathesar/component-library/anchorButton/AnchorButton.svelte';
  import type { QueryInstance } from '@mathesar/api/types/queries';
  import { labeledCount } from '@mathesar/utils/languageUtils';
  import ExplorationsList from './ExplorationsList.svelte';
  import EntityLayout from './EntityLayout.svelte';
  import CreateNewExplorationTutorial from './CreateNewExplorationTutorial.svelte';

  export let database: Database;
  export let schema: SchemaEntry;
  export let explorationsMap: Map<number, QueryInstance>;
  export let hasTablesToExplore: boolean;
  export let canEditMetadata: boolean;

  $: showTutorial =
    explorationsMap.size === 0 && hasTablesToExplore && canEditMetadata;

  let explorationsSearchQuery = '';

  function filterExplorations(
    _explorationsMap: Map<number, QueryInstance>,
    searchQuery: string,
  ) {
    return [..._explorationsMap.values()].filter((exploration) =>
      exploration.name.toLowerCase().includes(searchQuery.trim().toLowerCase()),
    );
  }

  $: filteredExplorations = filterExplorations(
    explorationsMap,
    explorationsSearchQuery,
  );

  function clearQuery() {
    explorationsSearchQuery = '';
  }
</script>

<EntityLayout
  searchPlaceholder="Search Explorations"
  bind:searchQuery={explorationsSearchQuery}
  on:clear={clearQuery}
>
  <svelte:fragment slot="action">
    <AnchorButton href={getDataExplorerPageUrl(database.name, schema.id)}>
      Open Data Explorer
    </AnchorButton>
  </svelte:fragment>
  <svelte:fragment slot="resultInfo">
    <p>
      {labeledCount(filteredExplorations, 'results')}
      for all explorations matching
      <strong>{explorationsSearchQuery}</strong>
    </p>
  </svelte:fragment>
  <svelte:fragment slot="content">
    {#if showTutorial}
      <CreateNewExplorationTutorial {database} {schema} />
    {:else}
      <ExplorationsList
        explorations={filteredExplorations}
        {database}
        {schema}
      />
    {/if}
  </svelte:fragment>
</EntityLayout>
