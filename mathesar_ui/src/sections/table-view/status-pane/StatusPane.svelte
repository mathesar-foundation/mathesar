<script lang="ts">
  import { getContext } from 'svelte';
  import { Pagination, Select } from '@mathesar-components';
  import type { TabularDataStore, TabularData } from '@mathesar/stores/table-data/types';

  const tabularData = getContext<TabularDataStore>('tabularData');
  $: ({
    selectedRecords, pageSize, page, offset,
  } = $tabularData.meta as TabularData['meta']);
  $: ({ records } = $tabularData as TabularData);
  $: selectedPageSize = { id: $pageSize as number, label: $pageSize as number };

  const pageSizeOpts = [
    { id: 100, label: '100' },
    { id: 200, label: '200' },
    { id: 500, label: '500' },
  ];

  let pageCount: number;
  $: max = Math.min($records.totalCount, $offset + $pageSize);

  function setPageSize(event: CustomEvent<{ value: { id: number, label: string } }>) {
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
      {$selectedRecords.size} record{$selectedRecords.size > 1 ? 's' : ''} selected of {$records.totalCount}

    {:else if pageCount > 0 && $records.totalCount}
      Showing {$offset + 1} - {max} of {$records.totalCount} records
    
    {:else}
      No records found
    {/if}
  </div>

  <div class="pagination-group">
    {#if $records.totalCount}
      <Pagination total={$records.totalCount} pageSize={$pageSize} bind:page={$page} bind:pageCount/>
      <Select options={pageSizeOpts} value={selectedPageSize} on:change={setPageSize}/>
    {/if}
  </div>
</div>

<style global lang="scss">
  @import "StatusPane.scss";
</style>
