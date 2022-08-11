<script lang="ts">
  import { States } from '@mathesar/utils/api';
  import {
    Button,
    Icon,
    Dropdown,
    DropdownMenu,
    MenuItem,
    iconError,
  } from '@mathesar-component-library';
  import { getTabularDataStoreFromContext } from '@mathesar/stores/table-data';
  import { refetchTablesForSchema, deleteTable } from '@mathesar/stores/tables';
  import { currentSchemaId } from '@mathesar/stores/schemas';
  import { currentDBName } from '@mathesar/stores/databases';
  import { getTabsForSchema } from '@mathesar/stores/tabs';
  import { confirmDelete } from '@mathesar/stores/confirmation';
  import { modal } from '@mathesar/stores/modal';
  import SaveStatusIndicator from '@mathesar/components/SaveStatusIndicator.svelte';
  import {
    iconAddNew,
    iconRename,
    iconDelete,
    iconFiltering,
    iconConstraint,
    iconTableLink,
    iconGrouping,
    iconConfigure,
    iconSorting,
    iconRefresh,
  } from '@mathesar/icons';
  import LinkTableModal from '../link-table/LinkTableModal.svelte';
  import TableConstraints from '../constraints/TableConstraints.svelte';
  import Sort from './record-operations/Sort.svelte';
  import Filter from './record-operations/Filter.svelte';
  import RenameTableModal from './RenameTableModal.svelte';

  const tabularData = getTabularDataStoreFromContext();

  const tableConstraintsModal = modal.spawnModalController();
  const linkTableModal = modal.spawnModalController();
  const tableRenameModal = modal.spawnModalController();

  $: ({ columnsDataStore, recordsData, meta, constraintsDataStore } =
    $tabularData);
  $: ({ columns } = $columnsDataStore);
  $: ({ filtering, sorting, grouping, selectedRows, sheetState } = meta);
  $: recordState = recordsData.state;

  $: isLoading =
    $columnsDataStore.state === States.Loading ||
    $recordState === States.Loading ||
    $constraintsDataStore.state === States.Loading;
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
        // @ts-ignore: https://github.com/centerofci/mathesar/issues/1055
        const tabList = getTabsForSchema($currentDBName, $currentSchemaId);
        const tab = tabList.getTabularTabByTabularID(
          $tabularData.type,
          $tabularData.id,
        );
        if (tab) {
          tabList.removeTabAndItsData(tab);
        }
        // @ts-ignore: https://github.com/centerofci/mathesar/issues/1055
        await refetchTablesForSchema($currentSchemaId);
      },
    });
  }
</script>

<div class="actions-pane">
  <DropdownMenu label="Table" icon={iconConfigure}>
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
      <!-- <DisplayGroup {columns} grouping={meta.grouping} /> -->
    </svelte:fragment>
  </Dropdown>

  <div class="divider" />

  <Button
    disabled={isLoading}
    size="small"
    on:click={() => recordsData.addEmptyRecord()}
  >
    <Icon {...iconAddNew} />
    <span>New Record</span>
  </Button>

  <div class="divider" />

  <Button
    disabled={isLoading}
    size="small"
    on:click={() => linkTableModal.open()}
  >
    <Icon {...iconTableLink} />
    <span>Link Table</span>
  </Button>

  {#if $selectedRows.size > 0}
    <Button size="small" on:click={() => recordsData.deleteSelected()}>
      <Icon {...iconDelete} />
      <span>
        Delete {$selectedRows.size} records
      </span>
    </Button>
  {/if}

  {#if $sheetState}
    <div class="divider" />
    <SaveStatusIndicator status={$sheetState} />
  {/if}

  <div class="loading-info">
    <Button size="small" disabled={isLoading} on:click={refresh}>
      <Icon
        {...isError && !isLoading ? iconError : iconRefresh}
        spin={isLoading}
      />
      <span>
        {#if isLoading}
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

<style global lang="scss">
  @import 'ActionsPane.scss';
</style>
