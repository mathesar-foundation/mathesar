<script lang="ts">
  import { createEventDispatcher, getContext } from 'svelte';
  import type { TabularDataStore, TabularData } from '@mathesar/stores/table-data/store';

  import {
    faFilter,
    faSort,
    faListAlt,
    faTrashAlt,
  } from '@fortawesome/free-solid-svg-icons';
  import { States } from '@mathesar/utils/api';
  import { Button, Icon } from '@mathesar-components';

  const dispatch = createEventDispatcher();

  const tabularData = getContext<TabularDataStore>('tabularData');
  $: ({
    columns, records, meta,
  } = $tabularData as TabularData);
  $: ({
    filter, sort, group, selectedRecords,
  } = meta as TabularData['meta']);

  function openDisplayOptions() {
    dispatch('openDisplayOptions');
  }
</script>

<div class="actions-pane">
  <Button appearance="plain" on:click={openDisplayOptions}>
    <Icon data={faFilter} size="0.8em"/>
    <span>
      Filters
      {#if $filter?.filters?.length > 0}
        ({$filter?.filters?.length})
      {/if}
    </span>
  </Button>

  <Button appearance="plain" on:click={openDisplayOptions}>
    <Icon data={faSort}/>
    <span>
      Sort
      {#if $sort?.size > 0}
        ({$sort?.size})
      {/if}
    </span>
  </Button>

  <Button appearance="plain" on:click={openDisplayOptions}>
    <Icon data={faListAlt}/>
    <span>
      Group
      {#if $group?.size > 0}
        ({$group?.size})
      {/if}
    </span>
  </Button>

  {#if $selectedRecords.length > 0}
    <Button appearance="plain" on:click={() => dispatch('deleteRecords')}>
      <Icon data={faTrashAlt}/>
      <span>
        Delete {$selectedRecords.length} records
      </span>
    </Button>
  {/if}

  <div class="loading-info">
    {#if $columns.state === States.Loading}
      | Loading table

    {:else if $columns.state === States.Error}
      | Error in loading table: {$columns.error}
    {/if}

    {#if $records.state === States.Loading}
      | Loading records

    {:else if $records.state === States.Error}
      | Error in loading records: {$records.error}
    {/if}
  </div>
</div>
