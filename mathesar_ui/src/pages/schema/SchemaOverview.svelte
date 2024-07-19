<script lang="ts">
  import { _ } from 'svelte-i18n';

  import type { QueryInstance } from '@mathesar/api/rest/types/queries';
  import type { RequestStatus } from '@mathesar/api/rest/utils/requestUtils';
  import type { Schema } from '@mathesar/api/rpc/schemas';
  import type { Table } from '@mathesar/api/rpc/tables';
  import type { Database } from '@mathesar/AppTypes';
  import SpinnerButton from '@mathesar/component-library/spinner-button/SpinnerButton.svelte';
  import ErrorBox from '@mathesar/components/message-boxes/ErrorBox.svelte';
  import { iconRefresh } from '@mathesar/icons';
  import { getDataExplorerPageUrl } from '@mathesar/routes/urls';
  import { refetchQueriesForSchema } from '@mathesar/stores/queries';
  import { refetchTablesForSchema } from '@mathesar/stores/tables';
  import { AnchorButton, Button } from '@mathesar-component-library';

  import CreateNewExplorationTutorial from './CreateNewExplorationTutorial.svelte';
  import CreateNewTableButton from './CreateNewTableButton.svelte';
  import CreateNewTableTutorial from './CreateNewTableTutorial.svelte';
  import ExplorationSkeleton from './ExplorationSkeleton.svelte';
  import ExplorationsList from './ExplorationsList.svelte';
  import OverviewHeader from './OverviewHeader.svelte';
  import TableSkeleton from './TableSkeleton.svelte';
  import TablesList from './TablesList.svelte';

  export let tablesMap: Map<number, Table>;
  export let explorationsMap: Map<number, QueryInstance>;
  export let tablesRequestStatus: RequestStatus;
  export let explorationsRequestStatus: RequestStatus;

  export let canExecuteDDL: boolean;
  export let canEditMetadata: boolean;

  export let database: Database;
  export let schema: Schema;

  $: hasTables = tablesMap.size > 0;
  $: hasExplorations = explorationsMap.size > 0;
  $: showTableCreationTutorial = !hasTables && canExecuteDDL;
  $: showExplorationTutorial = hasTables && !hasExplorations && canEditMetadata;
  $: isExplorationsLoading = explorationsRequestStatus.state === 'processing';

  // Viewers can explore, they cannot save explorations
  $: canExplore = hasTables && hasExplorations && !isExplorationsLoading;
</script>

<div class="container">
  <div class="vertical-container tables">
    <OverviewHeader title={$_('tables')}>
      <svelte:fragment slot="action">
        {#if canExecuteDDL}
          <CreateNewTableButton {database} {schema} />
        {/if}
      </svelte:fragment>
    </OverviewHeader>
    {#if tablesRequestStatus.state === 'processing'}
      <TableSkeleton numTables={schema.table_count} />
    {:else if tablesRequestStatus.state === 'failure'}
      <ErrorBox>
        <p>{tablesRequestStatus.errors[0]}</p>
        <div>
          <SpinnerButton
            onClick={async () => {
              await refetchTablesForSchema(schema.oid);
            }}
            label={$_('retry')}
            icon={iconRefresh}
          />
          <a href="../">
            <Button>
              <span>{$_('go_to_database')}</span>
            </Button>
          </a>
        </div>
      </ErrorBox>
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
      <OverviewHeader title={$_('saved_explorations')} />
      {#if isExplorationsLoading}
        <ExplorationSkeleton />
      {:else if explorationsRequestStatus.state === 'failure'}
        <ErrorBox>
          <p>{explorationsRequestStatus.errors[0]}</p>
          <div>
            <SpinnerButton
              onClick={async () => {
                await refetchQueriesForSchema(schema.oid);
              }}
              label={$_('retry')}
              icon={iconRefresh}
            />
            <a href="../">
              <Button>
                <span>{$_('go_to_database')}</span>
              </Button>
            </a>
          </div>
        </ErrorBox>
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
        <OverviewHeader title={$_('explore_your_data')} />
        <span>
          {$_('what_is_an_exploration_mini')}
        </span>
        <div>
          <AnchorButton href={getDataExplorerPageUrl(database.id, schema.oid)}>
            {$_('open_data_explorer')}
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
