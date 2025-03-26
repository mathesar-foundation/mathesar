<script lang="ts">
  import { _ } from 'svelte-i18n';

  import type { RequestStatus } from '@mathesar/api/rest/utils/requestUtils';
  import type { SavedExploration } from '@mathesar/api/rpc/explorations';
  import SpinnerButton from '@mathesar/component-library/spinner-button/SpinnerButton.svelte';
  import ErrorBox from '@mathesar/components/message-boxes/ErrorBox.svelte';
  import { iconRefresh } from '@mathesar/icons';
  import type { Database } from '@mathesar/models/Database';
  import type { Schema } from '@mathesar/models/Schema';
  import type { Table } from '@mathesar/models/Table';
  import { getDataExplorerPageUrl } from '@mathesar/routes/urls';
  import { fetchExplorationsForCurrentSchema } from '@mathesar/stores/queries';
  import { fetchTablesForCurrentSchema } from '@mathesar/stores/tables';
  import { AnchorButton, Button } from '@mathesar-component-library';

  import CreateExplorationTutorial from './CreateExplorationTutorial.svelte';
  import CreateTableButton from './CreateTableButton.svelte';
  import CreateTableTutorial from './CreateTableTutorial.svelte';
  import ExplorationSkeleton from './ExplorationSkeleton.svelte';
  import ExplorationsList from './ExplorationsList.svelte';
  import OverviewHeader from './OverviewHeader.svelte';
  import TableSkeleton from './TableSkeleton.svelte';
  import TablesList from './TablesList.svelte';

  export let tablesMap: Map<Table['oid'], Table>;
  export let explorationsMap: Map<number, SavedExploration>;
  export let tablesRequestStatus: RequestStatus;
  export let explorationsRequestStatus: RequestStatus;
  export let database: Database;
  export let schema: Schema;
  export let onCreateEmptyTable: () => void;

  $: hasTables = tablesMap.size > 0;
  $: hasExplorations = explorationsMap.size > 0;
  $: ({ currentRolePrivileges } = schema.currentAccess);
  $: showTableCreationTutorial =
    !hasTables && $currentRolePrivileges.has('CREATE');
  $: showExplorationTutorial = hasTables && !hasExplorations;
  $: isExplorationsLoading = explorationsRequestStatus.state === 'processing';
  $: ({ tableCount } = schema);

  // Viewers can explore, they cannot save explorations
  $: canExplore = hasTables && hasExplorations && !isExplorationsLoading;
</script>

<div class="container">
  <div class="vertical-container tables">
    <OverviewHeader title={$_('tables')}>
      <svelte:fragment slot="action">
        <CreateTableButton {database} {schema} {onCreateEmptyTable} />
      </svelte:fragment>
    </OverviewHeader>
    {#if tablesRequestStatus.state === 'processing'}
      <TableSkeleton numTables={$tableCount} />
    {:else if tablesRequestStatus.state === 'failure'}
      <ErrorBox>
        <p>{tablesRequestStatus.errors[0]}</p>
        <div>
          <SpinnerButton
            onClick={async () => {
              await fetchTablesForCurrentSchema();
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
      <CreateTableTutorial {database} {schema} {onCreateEmptyTable} />
    {:else}
      <TablesList tables={[...tablesMap.values()]} {database} {schema} />
    {/if}
  </div>

  <div class="vertical-container sidebar">
    <section class="sidebar-section">
      <OverviewHeader title={$_('saved_explorations')} />
      {#if isExplorationsLoading}
        <ExplorationSkeleton />
      {:else if explorationsRequestStatus.state === 'failure'}
        <ErrorBox>
          <p>{explorationsRequestStatus.errors[0]}</p>
          <div>
            <SpinnerButton
              onClick={async () => {
                await fetchExplorationsForCurrentSchema();
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
        <CreateExplorationTutorial {database} {schema} />
      {:else}
        <ExplorationsList
          bordered={false}
          explorations={[...explorationsMap.values()]}
          {database}
          {schema}
        />
      {/if}

      {#if canExplore}
        <div class="explore-cta">
          <h3 class="explore-title">{$_('explore_your_data')}</h3>
          <p class="explore-description">
            {$_('what_is_an_exploration_mini')}
          </p>
          <div>
            <AnchorButton
              href={getDataExplorerPageUrl(database.id, schema.oid)}
              size="small"
            >
              {$_('open_data_explorer')}
            </AnchorButton>
          </div>
        </div>
      {/if}
    </section>
  </div>
</div>

<style lang="scss">
  .container {
    --container-gap: 3rem;
    display: flex;
    flex-direction: column;

    > :global(* + *) {
      margin-top: var(--container-gap);
    }
  }

  .vertical-container {
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }

  .sidebar-section {
    background-color: white;
    border-radius: 0.5rem;
    padding: 1.5rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);

    > :global(* + *) {
      margin-top: 1rem;
    }
  }

  .explore-cta {
    margin: 1.5rem -1.5rem -1.5rem;
    padding: 1.5rem;
    background: linear-gradient(
      to bottom right,
      var(--stormy-100),
      var(--stormy-50)
    );
    border-top: 1px solid var(--stormy-200);
    border-radius: 0 0 0.5rem 0.5rem;

    .explore-title {
      font-size: var(--text-size-large);
      font-weight: var(--font-weight-bold);
      color: var(--stormy-800);
      margin: 0 0 0.5rem 0;
    }

    .explore-description {
      color: var(--stormy-600);
      font-size: var(--text-size-base);
      margin: 0 0 1rem 0;
    }
  }

  @media screen and (min-width: 64rem) {
    .container {
      flex-direction: row;

      > :global(* + *) {
        margin-left: var(--container-gap);
        margin-top: 0;
      }
    }

    .tables {
      flex: 1;
      min-width: 0;
    }

    .sidebar {
      width: 24rem;
      flex-shrink: 0;
    }
  }
</style>
