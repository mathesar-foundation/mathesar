<script lang="ts">
  import {
    Pagination as PaginationComponent,
    Select,
  } from '@mathesar-component-library';
  import { States } from '@mathesar/utils/api';
  import {
    getTabularDataStoreFromContext,
    Pagination,
  } from '@mathesar/stores/table-data';

  const tabularData = getTabularDataStoreFromContext();

  $: ({ recordsData, meta } = $tabularData);
  $: ({ selectedRows, pagination } = meta);
  $: ({ size: pageSize, page, offset } = $pagination);
  $: ({ totalCount, state, newRecords } = recordsData);
  $: recordState = $state;

  const pageSizeOpts = [100, 200, 500];

  let pageCount: number;
  $: max = Math.min($totalCount ?? 0, offset + pageSize);

  function handlePageChange(event: {
    detail: {
      currentPage: number;
    };
  }) {
    pagination.update(
      (p) => new Pagination({ ...p, page: event.detail.currentPage }),
    );
  }

  function setPageSize(event: CustomEvent<number | undefined>) {
    const newPageSize = event.detail;
    if (typeof newPageSize !== 'undefined' && pageSize !== newPageSize) {
      $pagination = new Pagination({ page: 1, size: newPageSize });
    }
  }
</script>

<div class="status-pane">
  <div class="record-count">
    {#if $selectedRows?.size > 0}
      {$selectedRows.size} record{$selectedRows.size > 1 ? 's' : ''} selected of
      {$totalCount}
    {:else if pageCount > 0 && $totalCount}
      Showing {offset + 1} to {max}
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
      <PaginationComponent
        total={$totalCount}
        {pageSize}
        bind:pageCount
        currentPage={page}
        on:change={handlePageChange}
      />
      <Select
        triggerAppearance="plain"
        options={pageSizeOpts}
        value={pageSize}
        on:change={setPageSize}
      />
    {/if}
  </div>
</div>

<style global lang="scss">
  @import 'StatusPane.scss';
</style>
