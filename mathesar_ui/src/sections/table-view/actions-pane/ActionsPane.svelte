<script lang="ts">
  import { getContext } from 'svelte';
  import {
    faFilter,
    faSort,
    faListAlt,
    faTrashAlt,
    faSync,
    faExclamationTriangle,
  } from '@fortawesome/free-solid-svg-icons';
  import { States } from '@mathesar/utils/api';
  import { Button, Icon } from '@mathesar-components';
  import type {
    TabularDataStore,
    TabularData,
    TableColumnData,
  } from '@mathesar/stores/table-data/types';
  import Dropdown from '@mathesar/components/dropdown/Dropdown.svelte';
  import type { SelectOption } from '@mathesar/components/types';
  import DisplayFilter from '../display-options/DisplayFilter.svelte';
  import DisplaySort from '../display-options/DisplaySort.svelte';
  import DisplayGroup from '../display-options/DisplayGroup.svelte';

  const tabularData = getContext<TabularDataStore>('tabularData');

  function getColumnOptions(_columns: TableColumnData): SelectOption<string>[] {
    return _columns?.data?.map((column) => ({
      id: column.name,
      label: column.name,
    })) || [];
  }

  $: ({
    columns, records, meta,
  } = $tabularData as TabularData);
  $: ({
    filter, sort, group, selectedRecords, combinedModificationState,
  } = meta as TabularData['meta']);

  $: isLoading = $columns.state === States.Loading
    || $records.state === States.Loading;
  $: isError = $columns.state === States.Error
    || $records.state === States.Error;
  $: columnOptions = getColumnOptions($columns);

  function deleteRecords() {
    void (records as TabularData['records']).deleteSelected();
  }

  function refresh() {
    void (columns as TabularData['columns']).fetch();
    void (records as TabularData['records']).fetch();
  }
</script>

<div class="actions-pane">
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

  {#if $selectedRecords.size > 0}
    <Button size="small" on:click={deleteRecords}>
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
