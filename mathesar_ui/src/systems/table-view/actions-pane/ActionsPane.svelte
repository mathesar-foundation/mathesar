<script lang="ts">
  import {
    Button,
    Dropdown,
    Icon,
    iconError,
  } from '@mathesar-component-library';
  import type { TableEntry } from '@mathesar/api/tables';
  import type { Database, SchemaEntry } from '@mathesar/AppTypes';
  import EntityType from '@mathesar/components/EntityType.svelte';
  import SaveStatusIndicator from '@mathesar/components/SaveStatusIndicator.svelte';
  import TableName from '@mathesar/components/TableName.svelte';
  import {
    iconAddNew,
    iconFiltering,
    iconGrouping,
    iconRefresh,
    iconSorting,
    iconTableInspector,
  } from '@mathesar/icons';
  import { getTabularDataStoreFromContext } from '@mathesar/stores/table-data';
  import { States } from '@mathesar/utils/api';
  import { constructDataExplorerUrlToSummarizeFromGroup } from '@mathesar/systems/data-explorer';
  import Filter from './record-operations/Filter.svelte';
  import Sort from './record-operations/Sort.svelte';
  import Group from './record-operations/Group.svelte';

  export let database: Database;
  export let schema: SchemaEntry;
  export let table: Pick<TableEntry, 'name'>;

  const tabularData = getTabularDataStoreFromContext();

  $: ({
    id,
    columnsDataStore,
    recordsData,
    meta,
    constraintsDataStore,
    isLoading,
    display,
  } = $tabularData);
  $: ({ columns } = columnsDataStore);
  $: columnsFetchStatus = columnsDataStore.fetchStatus;
  $: ({ filtering, sorting, grouping, sheetState } = meta);
  $: ({ isTableInspectorVisible } = display);
  $: recordState = recordsData.state;

  $: isError =
    $columnsFetchStatus?.state === 'failure' ||
    $recordState === States.Error ||
    $constraintsDataStore.state === States.Error;

  $: summarizationUrl = constructDataExplorerUrlToSummarizeFromGroup(
    database.name,
    schema.id,
    {
      baseTableId: id,
      columns: $columns,
      terseGrouping: $grouping.terse(),
    },
  );

  function refresh() {
    void $tabularData.refresh();
  }

  function toggleTableInspector() {
    isTableInspectorVisible.set(!$isTableInspectorVisible);
  }
</script>

<div class="actions-pane">
  <div class="heading">
    <EntityType>Table</EntityType>
    <h1><TableName {table} /></h1>
  </div>

  <Dropdown showArrow={false} contentClass="filter-dropdown-content">
    <svelte:fragment slot="trigger">
      <Icon {...iconFiltering} size="0.8em" />
      <span>
        Filters
        {#if $filtering.entries.length > 0}
          ({$filtering.entries.length})
        {/if}
      </span>
    </svelte:fragment>
    <svelte:fragment slot="content">
      <Filter filtering={meta.filtering} />
    </svelte:fragment>
  </Dropdown>

  <Dropdown showArrow={false}>
    <svelte:fragment slot="trigger">
      <Icon {...iconSorting} />
      <span>
        Sort
        {#if $sorting.size > 0}
          ({$sorting.size})
        {/if}
      </span>
    </svelte:fragment>
    <svelte:fragment slot="content">
      <Sort columns={$columns} sorting={meta.sorting} />
    </svelte:fragment>
  </Dropdown>

  <Dropdown showArrow={false}>
    <svelte:fragment slot="trigger">
      <Icon {...iconGrouping} />
      <span>
        Group
        {#if $grouping.entries.length > 0}
          ({$grouping.entries.length})
        {/if}
      </span>
    </svelte:fragment>
    <svelte:fragment slot="content">
      <Group grouping={meta.grouping} />
    </svelte:fragment>
  </Dropdown>

  <!-- Restricting Data Explorer redirection to single column
      grouping for the time being -->
  {#if summarizationUrl && $grouping.entries.length === 1}
    <a href={summarizationUrl}>Summarize</a>
  {/if}

  <div class="divider" />

  <Button
    disabled={$isLoading}
    size="medium"
    on:click={() => recordsData.addEmptyRecord()}
  >
    <Icon {...iconAddNew} />
    <span>New Record</span>
  </Button>

  {#if $sheetState}
    <div class="divider" />
    <SaveStatusIndicator status={$sheetState} />
  {/if}

  <div class="loading-info">
    <Button size="medium" disabled={$isLoading} on:click={refresh}>
      <Icon
        {...isError && !isLoading ? iconError : iconRefresh}
        spin={$isLoading}
      />
      <span>
        {#if $isLoading}
          Loading
        {:else if isError}
          Retry
        {:else}
          Refresh
        {/if}
      </span>
    </Button>
  </div>

  <Button size="medium" disabled={$isLoading} on:click={toggleTableInspector}>
    <Icon {...iconTableInspector} />
  </Button>
</div>

<style>
  .actions-pane {
    border-bottom: 1px solid var(--color-gray-dark);
    background-color: var(--color-white);
    position: relative;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding-right: 1rem;
  }
  .heading {
    display: flex;
    flex-direction: column;
    border-right: 1px solid var(--color-gray-medium);
    padding: 1rem;
    margin-right: 0.5rem;
  }
  .heading h1 {
    font-size: var(--text-size-x-large);
    font-weight: 500;
    margin-bottom: 0;
  }
  .divider {
    width: 1px;
    display: inline-block;
    background: #dfdfdf;
    height: 2rem;
    margin: 0px 5px;
  }
  .loading-info {
    margin-left: auto;
  }
  .actions-pane :global(.filter-dropdown-content.dropdown.content) {
    overflow-x: hidden;
    max-height: 320px;
  }
</style>
