<script lang="ts">
  import { createEventDispatcher, getContext } from 'svelte';
  import {
    faFilter,
    faSort,
    faListAlt,
    faTrashAlt,
    faSync,
    faExclamationTriangle,
  } from '@fortawesome/free-solid-svg-icons';
  import { States } from '@mathesar/utils/api';
  import { Button, Icon, Dropdown } from '@mathesar-components';
  
  import type { TabularDataStore, TabularData } from '@mathesar/stores/table-data/types';

  const dispatch = createEventDispatcher();

  const tabularData = getContext<TabularDataStore>('tabularData');
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

  function openDisplayOptions() {
    dispatch('openDisplayOptions');
  }

  function deleteRecords() {
    void (records as TabularData['records']).deleteSelected();
  }

  function refresh() {
    void (columns as TabularData['columns']).fetch();
    void (records as TabularData['records']).fetch();
  }
</script>

<div class="actions-pane">
  <Dropdown closeOnInnerClick={true} triggerClass="opts" 
   contentClass="table-opts-content" size="small"> 
    <svelte:fragment slot="trigger">
        Table
    </svelte:fragment>
    <svelte:fragment slot="content">
      <ul>
        <li class= "item" on:click={() => dispatch('deleteTable')}>Delete Table</li>
      </ul>
    </svelte:fragment>
  </Dropdown>

  <Button size="small" on:click={openDisplayOptions}>
    <Icon data={faFilter} size="0.8em"/>
    <span>
      Filters
      {#if $filter?.filters?.length > 0}
        ({$filter?.filters?.length})
      {/if}
    </span>
  </Button>

  <Button size="small" on:click={openDisplayOptions}>
    <Icon data={faSort}/>
    <span>
      Sort
      {#if $sort?.size > 0}
        ({$sort?.size})
      {/if}
    </span>
  </Button>

  <Button size="small" on:click={openDisplayOptions}>
    <Icon data={faListAlt}/>
    <span>
      Group
      {#if $group?.size > 0}
        ({$group?.size})
      {/if}
    </span>
  </Button>

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
