<script lang="ts">
  import { _ } from 'svelte-i18n';
  import { getDataExplorerPageUrl } from '@mathesar/routes/urls';
  import type { Database, SchemaEntry } from '@mathesar/AppTypes';
  import { AnchorButton } from '@mathesar-component-library';
  import type { QueryInstance } from '@mathesar/api/types/queries';
  import EntityContainerWithFilterBar from '@mathesar/components/EntityContainerWithFilterBar.svelte';
  import { RichText } from '@mathesar/components/rich-text';
  import ExplorationsList from './ExplorationsList.svelte';
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

<EntityContainerWithFilterBar
  searchPlaceholder={$_('search_explorations')}
  bind:searchQuery={explorationsSearchQuery}
  on:clear={clearQuery}
>
  <svelte:fragment slot="action">
    <AnchorButton href={getDataExplorerPageUrl(database.id, schema.id)}>
      {$_('open_data_explorer')}
    </AnchorButton>
  </svelte:fragment>
  <svelte:fragment slot="resultInfo">
    <p>
      <RichText
        text={$_('explorations_matching_search', {
          values: { count: filteredExplorations.length },
        })}
        let:slotName
      >
        {#if slotName === 'searchValue'}
          <strong>{explorationsSearchQuery}</strong>
        {/if}
      </RichText>
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
</EntityContainerWithFilterBar>
