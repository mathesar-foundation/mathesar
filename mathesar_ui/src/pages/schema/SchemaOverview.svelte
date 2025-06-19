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
    {#if showExplorationTutorial}
      <CreateExplorationTutorial {database} {schema} />
    {:else}
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
        {:else}
          <ExplorationsList
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
                appearance="tip"
              >
                {$_('open_data_explorer')}
              </AnchorButton>
            </div>
          </div>
        {/if}
      </section>
    {/if}
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
    > :global(* + *) {
      margin-top: var(--sm2);
    }
  }

  .explore-cta {
    padding: var(--lg1);
    background:  color-mix(in srgb, var(--SYS-semantic-tip-bg), transparent 60%);
    box-shadow: 0 4px 8px  color-mix(in srgb, var(--SYS-border-shadow), transparent 8%);
    border: 1px solid var(--SYS-semantic-tip-button-border);
    border-radius: var(--sm1);
    position: relative;
    overflow: hidden;

    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      pointer-events: none;
    }

    .explore-title {
      font-size: var(--lg1);
      font-weight: var(--font-weight-bold);
      color: var(--SYS-semantic-tip-text);
      margin: 0 0 0.75rem 0;
      position: relative;
    }

    .explore-description {
      color: var(--SYS-semantic-tip-button-text);
      font-size: 1rem;
      margin: 0 0 1.5rem 0;
      position: relative;
      line-height: 1.5;
    }

    > div {
      position: relative;
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
