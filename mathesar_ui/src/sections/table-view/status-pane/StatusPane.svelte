<script lang="ts">
  import { getContext } from 'svelte';
  import { Pagination, Select } from '@mathesar-component-library';
  import { States } from '@mathesar/utils/api';
  import type { TabularDataStore } from '@mathesar/stores/table-data/types';

  const tabularData = getContext<TabularDataStore>('tabularData');

  $: ({ recordsData, meta } = $tabularData);
  $: ({ selectedRecords, pageSize, page, offset } = meta);
  $: ({ totalCount, state, newRecords } = recordsData);
  $: recordState = $state;
  $: selectedPageSize = { id: $pageSize, label: $pageSize };

  const pageSizeOpts = [
    { id: 100, label: '100' },
    { id: 200, label: '200' },
    { id: 500, label: '500' },
  ];

  let pageCount: number;
  $: max = Math.min($totalCount ?? 0, $offset + $pageSize);

  function setPageSize(
    event: CustomEvent<{ value: { id: number; label: string } }>,
  ) {
    const newPageSize = event.detail.value.id;
    if ($pageSize !== newPageSize) {
      $pageSize = newPageSize;
      $page = 1;
    }
  }
</script>

<div class="status-pane">
  <div class="record-count">
    {#if $selectedRecords?.size > 0}
      {$selectedRecords.size} record{$selectedRecords.size > 1 ? 's' : ''} selected
      of {$totalCount}
    {:else if pageCount > 0 && $totalCount}
      Showing {$offset + 1} to {max}
      {#if $newRecords.length > 0}
        (+ {$newRecords.length} new record{$newRecords.length > 1 ? 's' : ''})
      {/if}
      of {$totalCount} records
    {:else if recordState !== States.Loading}
      No records found
    {/if}
  </div>

  <div class="pagination-group">
    {#if $totalCount}
      <Pagination
        total={$totalCount}
        pageSize={$pageSize}
        bind:currentPage={$page}
        bind:pageCount
      />
      <Select
        options={pageSizeOpts}
        value={selectedPageSize}
        on:change={setPageSize}
      />
    {/if}
  </div>
</div>

<style global lang="scss">
  @import 'StatusPane.scss';
</style>
