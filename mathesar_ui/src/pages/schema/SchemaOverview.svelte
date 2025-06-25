<script lang="ts">
  import { _ } from 'svelte-i18n';

  import type { RequestStatus } from '@mathesar/api/rest/utils/requestUtils';
  import type { SavedExploration } from '@mathesar/api/rpc/explorations';
  import SpinnerButton from '@mathesar/component-library/spinner-button/SpinnerButton.svelte';
  import ErrorBox from '@mathesar/components/message-boxes/ErrorBox.svelte';
  import { iconAddNew, iconRefresh } from '@mathesar/icons';
  import type { Database } from '@mathesar/models/Database';
  import type { Schema } from '@mathesar/models/Schema';
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
  import ExplorationSkeleton from './ExplorationSkeleton.svelte';
  import ExplorationsList from './ExplorationsList.svelte';
  import FormsList from './FormsList.svelte';
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
  $: ({ currentRolePrivileges } = schema.currentAccess);
  $: showTableCreationTutorial =
    !hasTables && $currentRolePrivileges.has('CREATE');
  $: isExplorationsLoading = explorationsRequestStatus.state === 'processing';
  $: ({ tableCount } = schema);
</script>

<div class="schema-overview" class:has-tables={hasTables}>
  <div class="tables">
    <header>
      <h2>{$_('tables')}</h2>
      <div>
        <CreateTableButton {database} {schema} {onCreateEmptyTable} />
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
      <CreateTableTutorial {database} {schema} {onCreateEmptyTable} />
    {:else}
      <TablesList tables={[...tablesMap.values()]} {database} {schema} />
    {/if}
  </div>

  <div class="sidebar">
    <section>
      <header>
        <h2>
          {$_('explorations')}
          <Help>{$_('what_is_an_exploration')}</Help>
        </h2>
        <div>
          <AnchorButton
            href={getDataExplorerPageUrl(database.id, schema.oid)}
            appearance="primary"
          >
            <Icon {...iconAddNew} />
            <span>{$_('new_exploration')}</span>
          </AnchorButton>
        </div>
      </header>
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
    </section>

    <section>
      <header>
        <h2>{$_('forms')}</h2>
        <div>
          <AnchorButton href="#TODO" appearance="primary">
            <Icon {...iconAddNew} />
            <span>{$_('new_form')}</span>
          </AnchorButton>
        </div>
      </header>
      <!-- TODO: handle loading and error states -->
      <FormsList {database} {schema} />
    </section>
  </div>
</div>

<style lang="scss">
  .schema-overview {
    gap: var(--lg5);
    display: grid;

    .sidebar {
      display: grid;
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
