<script lang="ts">
  import { createEventDispatcher, getContext } from 'svelte';
  import {
    faFilter,
    faSort,
    faListAlt,
    faTrashAlt,
    faSync,
    faExclamationTriangle,
    faPlus,
    faCog,
    faKey,
  } from '@fortawesome/free-solid-svg-icons';
  import { States } from '@mathesar/utils/api';
  import { Button, Icon } from '@mathesar-components';
  import type {
    TabularDataStore,
    TabularData,
    Records,
    Columns,
    Meta,
  } from '@mathesar/stores/table-data/types';
  import Dropdown from '@mathesar/components/dropdown/Dropdown.svelte';
  import TableConstraints from '../constraints/TableConstraints.svelte';

  const dispatch = createEventDispatcher();

  const tabularData = getContext<TabularDataStore>('tabularData');

  let records: Records;
  let columns: Columns;
  let meta: Meta;
  let recordState: Records['state'];
  let isTableConstraintsModalOpen = false;

  $: ({
    columns, records, meta,
  } = $tabularData as TabularData);
  $: ({
    filter, sort, group, selectedRecords, combinedModificationState,
  } = meta);
  $: ({ state: recordState } = records);

  $: isLoading = $columns.state === States.Loading
    || $recordState === States.Loading;
  $: isError = $columns.state === States.Error
    || $recordState === States.Error;

  function openDisplayOptions() {
    dispatch('openDisplayOptions');
  }

  function refresh() {
    void columns.fetch();
    void records.fetch();
  }
</script>

<div class="actions-pane">
  <Dropdown closeOnInnerClick={true} ariaLabel="Table Actions">
    <svelte:fragment slot="trigger">
      <Icon data={faCog}/>
      Table Actions
    </svelte:fragment>
    <svelte:fragment slot="content">
      <div class="new-table-options">
        <Button
          appearance="plain"
          on:click={() => { isTableConstraintsModalOpen = true; }}
        >
          <Icon data={faKey} size="0.8em"/>
          <span>Table Constraints</span>
        </Button>
      </div>
    </svelte:fragment>
  </Dropdown>

  <TableConstraints bind:isOpen={isTableConstraintsModalOpen} />

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

  <div class="divider"/>

  <Button size="small" on:click={() => records.addEmptyRecord()}>
    <Icon data={faPlus}/>
    <span>
      New Record
    </span>
  </Button>

  {#if $selectedRecords.size > 0}
    <Button size="small" on:click={() => records.deleteSelected()}>
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
