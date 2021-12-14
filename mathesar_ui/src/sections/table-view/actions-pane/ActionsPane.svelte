<script lang="ts">
  import { getContext } from 'svelte';
  import {
    faFilter,
    faSort,
    faListAlt,
    faTrashAlt,
    faSync,
    faExclamationTriangle,
    faPlus,
    faCog,
  } from '@fortawesome/free-solid-svg-icons';
  import { States } from '@mathesar/utils/api';
  import { Button, Icon, Dropdown } from '@mathesar-component-library';
  import type {
    TabularDataStore,
    TabularData,
    RecordsData,
    ColumnsDataStore,
    ColumnsData,
    Meta,
  } from '@mathesar/stores/table-data/types';
  import type { SelectOption } from '@mathesar-component-library/types';
  import type { ConstraintsDataStore } from '@mathesar/stores/table-data/types';
  import {
    refetchTablesForSchema,
    deleteTable,
  } from '@mathesar/stores/tables';
  import { currentSchemaId } from '@mathesar/stores/schemas';
  import { currentDBName } from '@mathesar/stores/databases';
  import { getTabsForSchema } from '@mathesar/stores/tabs';
  import { confirmDelete } from '@mathesar/stores/confirmation';
  import { modal } from '@mathesar/stores/modal';
  import TableConstraints from '../constraints/TableConstraints.svelte';
  import DisplayFilter from '../display-options/DisplayFilter.svelte';
  import DisplaySort from '../display-options/DisplaySort.svelte';
  import DisplayGroup from '../display-options/DisplayGroup.svelte';
  import RenameTableModal from './RenameTableModal.svelte';

  const tabularData = getContext<TabularDataStore>('tabularData');
  
  function getColumnOptions(columnsData: ColumnsData): SelectOption<string>[] {
    return columnsData?.columns?.map((column) => ({
      id: column.name,
      label: column.name,
    })) || [];
  }

  let recordsData: RecordsData;
  let columnsDataStore: ColumnsDataStore;
  let constraintsDataStore: ConstraintsDataStore;
  let meta: Meta;
  let recordState: RecordsData['state'];
  let isTableConstraintsModalOpen = false;
  const tableRenameModal = modal.createVisibilityStore();

  $: ({
    columnsDataStore, recordsData, meta, constraintsDataStore,
  } = $tabularData as TabularData);
  $: ({
    filter, sort, group, selectedRecords, combinedModificationState,
  } = meta);
  $: ({ state: recordState } = recordsData);

  $: isLoading = $columnsDataStore.state === States.Loading
    || $recordState === States.Loading
    || $constraintsDataStore.state === States.Loading;
  $: isError = $columnsDataStore.state === States.Error
    || $recordState === States.Error
    || $constraintsDataStore.state === States.Error;
  $: columnOptions = getColumnOptions($columnsDataStore);

  function refresh() {
    void ($tabularData as TabularData).refresh();
  }

  function handleDeleteTable() {
    void confirmDelete({
      identifierType: 'Table',
      onProceed: async () => {
        await deleteTable($tabularData.id);
        const tabList = getTabsForSchema($currentDBName, $currentSchemaId);
        const tab = tabList.getTabularTabByTabularID($tabularData.type, $tabularData.id);
        tabList.remove(tab);
        await refetchTablesForSchema($currentSchemaId);
      },
    });
  }
</script>

<div class="actions-pane">
  <Dropdown
    closeOnInnerClick={true}
    triggerClass="opts"
    contentClass="table-opts-content"
    ariaLabel="Table Actions"
  >
    <svelte:fragment slot="trigger">
      <Icon data={faCog}/>
      Table
    </svelte:fragment>
    <svelte:fragment slot="content">
      <ul>
        <li class="item" on:click={() => tableRenameModal.open()}>
          Rename
        </li>
        <li class="item" on:click={handleDeleteTable}>
          Delete
        </li>
        <li class="item" on:click={() => { isTableConstraintsModalOpen = true; }}>
          Constraints
        </li>
      </ul>
    </svelte:fragment>
  </Dropdown>

  <TableConstraints bind:isOpen={isTableConstraintsModalOpen} />

  <RenameTableModal bind:isOpen={$tableRenameModal} tabularData={$tabularData} />

  <div class="divider"/>

  <Dropdown showArrow={false}>
    <svelte:fragment slot="trigger">
      <Icon data={faFilter} size="0.8em"/>
      <span>
        Filters
        {#if $filter?.filters?.length > 0}
          ({$filter?.filters?.length})
        {/if}
      </span>
    </svelte:fragment>
    <svelte:fragment slot="content">
      <DisplayFilter options={columnOptions} {meta}/>
    </svelte:fragment>
  </Dropdown>

  <Dropdown showArrow={false}>
    <svelte:fragment slot="trigger">
      <Icon data={faSort}/>
      <span>
        Sort
        {#if $sort?.size > 0}
          ({$sort?.size})
        {/if}
      </span>
    </svelte:fragment>
    <svelte:fragment slot="content">
      <DisplaySort options={columnOptions} {meta}/>
    </svelte:fragment>
  </Dropdown>

  <Dropdown showArrow={false}>
    <svelte:fragment slot="trigger">
      <Icon data={faListAlt}/>
      <span>
        Group
        {#if $group?.size > 0}
          ({$group?.size})
        {/if}
      </span>
    </svelte:fragment>
    <svelte:fragment slot="content">
      <DisplayGroup options={columnOptions} {meta}/>
    </svelte:fragment>
  </Dropdown>

  <div class="divider"/>

  <Button size="small" on:click={() => recordsData.addEmptyRecord()}>
    <Icon data={faPlus}/>
    <span>
      New Record
    </span>
  </Button>

  {#if $selectedRecords.size > 0}
    <Button size="small" on:click={() => recordsData.deleteSelected()}>
      <Icon data={faTrashAlt}/>
      <span>
        Delete {$selectedRecords.size} records
      </span>
    </Button>
  {/if}

  {#if $combinedModificationState !== 'idle'}
    <div class="divider"/>
    <div class="save-status">
      {#if $combinedModificationState === 'inprocess'}
        Saving changes
      {:else if $combinedModificationState === 'error'}
        <span class="error">! Couldn't save changes</span>
      {:else if $combinedModificationState === 'complete'}
        All changes saved
      {/if}
    </div>
  {/if}

  <div class="loading-info">
    <Button size="small" disabled={isLoading} on:click={refresh}>
      <Icon data={
        isError && !isLoading ? faExclamationTriangle : faSync
      } spin={isLoading}/>
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
  @import "ActionsPane.scss";
</style>
