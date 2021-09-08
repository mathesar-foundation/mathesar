<script lang="ts">
  import { getContext } from 'svelte';
  import { Pagination, Select } from '@mathesar-components';
  import type { TabularDataStore, TabularData } from '@mathesar/stores/table-data/store';

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
    {#if $selectedRecords?.length > 0}
      {$selectedRecords.length} record{$selectedRecords.length > 1 ? 's' : ''} selected
    {/if}
  </div>

  <div class="pagination">
    {#if pageCount > 0}
      <div>Showing {$offset + 1} - {max} of {$records.totalCount} records</div>
    {/if}

    {#if $records.totalCount}
      <Select options={pageSizeOpts} value={selectedPageSize} on:change={setPageSize}/>
      <Pagination total={$records.totalCount} pageSize={$pageSize} bind:page={$page} bind:pageCount/>
    {/if}
  </div>
</div>

<style global lang="scss">
  @import "StatusPane.scss";
</style>
