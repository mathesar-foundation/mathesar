<script lang="ts">
  import {
    Button,
    Dropdown,
    DropdownMenu,
    Icon,
    iconError,
    MenuItem,
  } from '@mathesar-component-library';
  import type { TableEntry } from '@mathesar/api/tables';
  import type { SchemaEntry } from '@mathesar/AppTypes';
  import EntityType from '@mathesar/components/EntityType.svelte';
  import SaveStatusIndicator from '@mathesar/components/SaveStatusIndicator.svelte';
  import TableName from '@mathesar/components/TableName.svelte';
  import {
    iconAddNew,
    iconConfigure,
    iconConstraint,
    iconDelete,
    iconFiltering,
    iconGrouping,
    iconRefresh,
    iconRename,
    iconSorting,
    iconTableLink,
  } from '@mathesar/icons';
  import { confirmDelete } from '@mathesar/stores/confirmation';
  import { modal } from '@mathesar/stores/modal';
  import { getTabularDataStoreFromContext } from '@mathesar/stores/table-data';
  import { deleteTable, refetchTablesForSchema } from '@mathesar/stores/tables';
  import { States } from '@mathesar/utils/api';
  import { createEventDispatcher } from 'svelte';
  import TableConstraints from '../constraints/TableConstraints.svelte';
  import LinkTableModal from '../link-table/LinkTableModal.svelte';
  import Filter from './record-operations/Filter.svelte';
  import Sort from './record-operations/Sort.svelte';
  import Group from './record-operations/Group.svelte';
  import RenameTableModal from './RenameTableModal.svelte';

  export let schema: SchemaEntry;
  export let table: TableEntry;

  const tabularData = getTabularDataStoreFromContext();
  const dispatch = createEventDispatcher();

  const tableConstraintsModal = modal.spawnModalController();
  const linkTableModal = modal.spawnModalController();
  const tableRenameModal = modal.spawnModalController();

  $: ({ columnsDataStore, recordsData, meta, constraintsDataStore, isLoading } =
    $tabularData);
  $: ({ columns } = $columnsDataStore);
  $: ({
    filtering,
    sorting,
    grouping,
    // selectedRows,
    sheetState,
  } = meta);
  $: recordState = recordsData.state;

  $: isError =
    $columnsDataStore.state === States.Error ||
    $recordState === States.Error ||
    $constraintsDataStore.state === States.Error;

  function refresh() {
    void $tabularData.refresh();
  }

  function handleDeleteTable() {
    void confirmDelete({
      identifierType: 'Table',
      onProceed: async () => {
        await deleteTable($tabularData.id);
        // TODO handle error when deleting
        dispatch('deleteTable');
        await refetchTablesForSchema(schema.id);
      },
    });
  }
</script>

<div class="actions-pane">
  <div class="heading">
    <EntityType>Table</EntityType>
    <h1><TableName {table} /></h1>
  </div>
  <DropdownMenu label="Actions" icon={iconConfigure}>
    <MenuItem on:click={() => tableRenameModal.open()} icon={iconRename}>
      Rename
    </MenuItem>
    <MenuItem on:click={handleDeleteTable} icon={iconDelete}>Delete</MenuItem>
    <MenuItem
      on:click={() => tableConstraintsModal.open()}
      icon={iconConstraint}
    >
      Constraints
    </MenuItem>
  </DropdownMenu>

  <TableConstraints controller={tableConstraintsModal} />

  <RenameTableModal controller={tableRenameModal} tabularData={$tabularData} />

  <LinkTableModal
    controller={linkTableModal}
    on:goToConstraints={() => tableConstraintsModal.open()}
  />

  <div class="divider" />

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
      <Sort {columns} sorting={meta.sorting} />
    </svelte:fragment>
  </Dropdown>

  <Dropdown showArrow={false}>
    <svelte:fragment slot="trigger">
      <Icon {...iconGrouping} />
      <span>
        Group
        {#if $grouping.size > 0}
          ({$grouping.size})
        {/if}
      </span>
    </svelte:fragment>
    <svelte:fragment slot="content">
      <Group {columns} grouping={meta.grouping} />
    </svelte:fragment>
  </Dropdown>

  <div class="divider" />

  <Button
    disabled={$isLoading}
    size="medium"
    on:click={() => recordsData.addEmptyRecord()}
  >
    <Icon {...iconAddNew} />
    <span>New Record</span>
  </Button>

  <div class="divider" />

  <Button
    disabled={$isLoading}
    size="medium"
    on:click={() => linkTableModal.open()}
  >
    <Icon {...iconTableLink} />
    <span>Link Table</span>
  </Button>

  <!-- TODO: Bring back the delete functionality -->
  <!-- {#if $selectedRows.size > 0}
    <Button size="small" on:click={() => recordsData.deleteSelected()}>
      <Icon {...iconDelete} />
      <span>
        Delete {$selectedRows.size} records
      </span>
    </Button>
  {/if} -->

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
