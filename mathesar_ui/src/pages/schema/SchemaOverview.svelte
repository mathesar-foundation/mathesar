<script lang="ts">
  import type { QueryInstance } from '@mathesar/api/types/queries';
  import type { TableEntry } from '@mathesar/api/types/tables';
  import type { Database, SchemaEntry } from '@mathesar/AppTypes';
  import { AnchorButton } from '@mathesar-component-library';
  import { getDataExplorerPageUrl } from '@mathesar/routes/urls';
  import OverviewHeader from './OverviewHeader.svelte';
  import TablesList from './TablesList.svelte';
  import ExplorationsList from './ExplorationsList.svelte';
  import CreateNewTableTutorial from './CreateNewTableTutorial.svelte';
  import CreateNewExplorationTutorial from './CreateNewExplorationTutorial.svelte';
  import CreateNewTableButton from './CreateNewTableButton.svelte';
  import TableSkeleton from './TableSkeleton.svelte';
  import ExplorationSkeleton from './ExplorationSkeleton.svelte';

  export let tablesMap: Map<number, TableEntry>;
  export let explorationsMap: Map<number, QueryInstance>;
  export let isTablesLoading = false;
  export let isExplorationsLoading = false;

  export let canExecuteDDL: boolean;
  export let canEditMetadata: boolean;

  export let database: Database;
  export let schema: SchemaEntry;

  $: hasTables = tablesMap.size > 0;
  $: hasExplorations = explorationsMap.size > 0;
  $: showTableCreationTutorial = !hasTables && canExecuteDDL;
  $: showExplorationTutorial = hasTables && !hasExplorations && canEditMetadata;

  // Viewers can explore, they cannot save explorations
  $: canExplore = hasTables && hasExplorations && !isExplorationsLoading;
</script>

<div class="container">
  <div class="vertical-container tables">
    <OverviewHeader title="Tables">
      <svelte:fragment slot="action">
        {#if canExecuteDDL}
          <CreateNewTableButton {database} {schema} />
        {/if}
      </svelte:fragment>
    </OverviewHeader>
    {#if isTablesLoading}
      <TableSkeleton />
    {:else if showTableCreationTutorial}
      <CreateNewTableTutorial {database} {schema} />
    {:else}
      <TablesList
        {canExecuteDDL}
        tables={[...tablesMap.values()]}
        {database}
        {schema}
      />
    {/if}
  </div>
  <div class="vertical-container explorations">
    <div class="vertical-container">
      <OverviewHeader title="Saved Explorations" />
      {#if isExplorationsLoading}
        <ExplorationSkeleton />
      {:else if showExplorationTutorial}
        <CreateNewExplorationTutorial {database} {schema} />
      {:else}
        <ExplorationsList
          bordered={false}
          explorations={[...explorationsMap.values()]}
          {database}
          {schema}
        />
      {/if}
    </div>

    {#if canExplore}
      <div class="vertical-container">
        <OverviewHeader title="Explore your Data" />
        <span>
          Explorations let you query your data to uncover trends and insights.
        </span>
        <div>
          <AnchorButton href={getDataExplorerPageUrl(database.name, schema.id)}>
            Open Data Explorer
          </AnchorButton>
        </div>
      </div>
    {/if}
  </div>
</div>

<style lang="scss">
  .container {
    --container-gap: 2rem;
    display: flex;
    flex-direction: column;

    > :global(* + *) {
      margin-top: var(--container-gap);
    }
  }

  .vertical-container {
    display: flex;
    flex-direction: column;

    > :global(* + *) {
      margin-top: 1rem;
    }
  }

  .explorations {
    > :global(* + *) {
      margin-top: 2rem;
    }
  }

  @media screen and (min-width: 64rem) {
    .container {
      flex-direction: row;

      > :global(* + *) {
        margin-left: var(--container-gap);
        margin-top: 0rem;
      }
    }
    .tables {
      flex-basis: 65%;
    }
    .explorations {
      flex-basis: 35%;
    }
  }
</style>
