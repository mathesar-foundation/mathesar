<script lang="ts">
  import { _ } from 'svelte-i18n';

  import type { RequestStatus } from '@mathesar/api/rest/utils/requestUtils';
  import type { SavedExploration } from '@mathesar/api/rpc/explorations';
  import SpinnerButton from '@mathesar/component-library/spinner-button/SpinnerButton.svelte';
  import Tutorial from '@mathesar/component-library/tutorial/Tutorial.svelte';
  import ErrorBox from '@mathesar/components/message-boxes/ErrorBox.svelte';
  import { SchemaRouteContext } from '@mathesar/contexts/SchemaRouteContext';
  import { iconAddNew, iconRefresh } from '@mathesar/icons';
  import type { Table } from '@mathesar/models/Table';
  import { getDataExplorerPageUrl } from '@mathesar/routes/urls';
  import { fetchExplorationsForCurrentSchema } from '@mathesar/stores/queries';
  import { fetchTablesForCurrentSchema } from '@mathesar/stores/tables';
  import {
    AnchorButton,
    Button,
    Help,
    Icon,
  } from '@mathesar-component-library';

  import CreateTableButton from './CreateTableButton.svelte';
  import CreateTableTutorial from './CreateTableTutorial.svelte';
  import ExplorationsList from './ExplorationsList.svelte';
  import ExploreYourData from './ExploreYourData.svelte';
  import FormsSection from './FormsSection.svelte';
  import SchemaOverviewSideSection from './SchemaOverviewSideSection.svelte';
  import TableSkeleton from './TableSkeleton.svelte';
  import TablesList from './TablesList.svelte';

  const schemaRouteContext = SchemaRouteContext.get();

  export let tablesMap: Map<Table['oid'], Table>;
  export let explorationsMap: Map<number, SavedExploration>;
  export let tablesRequestStatus: RequestStatus;
  export let explorationsRequestStatus: RequestStatus;
  export let onCreateEmptyTable: () => void;

  $: ({ schema, dataFormsFetch } = $schemaRouteContext);
  $: void dataFormsFetch.runConservatively();

  $: hasTables = tablesMap.size > 0;
  $: hasExplorations = explorationsMap.size > 0;
  $: ({ currentRolePrivileges } = schema.currentAccess);
  $: showTableCreationTutorial =
    !hasTables && $currentRolePrivileges.has('CREATE');
  $: isExplorationsLoading = explorationsRequestStatus.state === 'processing';
  $: ({ tableCount } = schema);
  $: dataExplorerPageUrl = getDataExplorerPageUrl(
    schema.database.id,
    schema.oid,
  );
</script>

<div class="schema-overview" class:has-tables={hasTables}>
  <div class="tables">
    <header>
      <h2>{$_('tables')}</h2>
      <div>
        <CreateTableButton
          database={schema.database}
          {schema}
          {onCreateEmptyTable}
        />
      </div>
    </header>
    {#if tablesRequestStatus.state === 'processing'}
      <TableSkeleton numTables={$tableCount} />
    {:else if tablesRequestStatus.state === 'failure'}
      <ErrorBox>
        <p>{tablesRequestStatus.errors[0]}</p>
        <div>
          <SpinnerButton
            onClick={() => fetchTablesForCurrentSchema()}
            label={$_('retry')}
            icon={iconRefresh}
          />
          <a class="btn" href="../">{$_('go_to_database')}</a>
        </div>
      </ErrorBox>
    {:else if showTableCreationTutorial}
      <CreateTableTutorial
        database={schema.database}
        {schema}
        {onCreateEmptyTable}
      />
    {:else}
      <TablesList
        tables={[...tablesMap.values()]}
        {schema}
        database={schema.database}
      />
    {/if}
  </div>

  <div class="sidebar">
    <SchemaOverviewSideSection
      isLoading={isExplorationsLoading}
      hasError={explorationsRequestStatus.state === 'failure'}
    >
      <svelte:fragment slot="header">
        {$_('explorations')}
        <Help>{$_('what_is_an_exploration')}</Help>
      </svelte:fragment>
      <svelte:fragment slot="actions">
        <AnchorButton href={dataExplorerPageUrl} appearance="secondary">
          <Icon {...iconAddNew} />
          <span>{$_('new_exploration')}</span>
        </AnchorButton>
      </svelte:fragment>
      <svelte:fragment slot="errors">
        {#if explorationsRequestStatus.state === 'failure'}
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
        {/if}
      </svelte:fragment>
      <svelte:fragment slot="content">
        {#if hasExplorations}
          <div class="explorations-list">
            <ExplorationsList
              explorations={[...explorationsMap.values()]}
              database={schema.database}
              {schema}
            />
          </div>
        {/if}
        {#if hasExplorations}
          <ExploreYourData href={dataExplorerPageUrl} />
        {:else}
          <Tutorial>
            <div slot="title">
              {$_('time_to_create_exploration')}
            </div>
            <div slot="body">
              {$_('what_is_an_exploration')}
            </div>
            <div slot="footer">
              <AnchorButton
                href={dataExplorerPageUrl}
                size="small"
                appearance="tip"
              >
                {$_('open_data_explorer')}
              </AnchorButton>
            </div>
          </Tutorial>
        {/if}
      </svelte:fragment>
    </SchemaOverviewSideSection>

    <FormsSection />
  </div>
</div>

<style lang="scss">
  .schema-overview {
    gap: var(--lg5);
    display: grid;

    .sidebar {
      display: grid;
      align-content: start;
      gap: var(--lg5);
    }

    header {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      margin-bottom: var(--lg1);

      h2 {
        margin: 0;
      }

      & > :global(:last-child) {
        flex-grow: 1;
        text-align: right;
      }
    }

    .explorations-list {
      margin-bottom: 1rem;
    }

    &:not(.has-tables) .sidebar {
      display: none;
    }
  }

  @media screen and (min-width: 55rem) {
    .schema-overview.has-tables {
      grid-template: auto / 1fr 25rem;
    }
  }
</style>
