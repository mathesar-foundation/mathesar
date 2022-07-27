<script lang="ts">
  import {
    Pagination as PaginationComponent,
    Select,
  } from '@mathesar-component-library';
  import Pagination from '@mathesar/utils/Pagination';

  export let pagination: Pagination;
  export let totalCount: number;
  export let pageSizeOpts = [100, 200, 500];

  $: ({ size: pageSize, page } = pagination);

  function handlePageChange(event: {
    detail: {
      currentPage: number;
    };
  }) {
    pagination = new Pagination({
      ...pagination,
      page: event.detail.currentPage,
    });
  }

  function setPageSize(event: CustomEvent<number | undefined>) {
    const newPageSize = event.detail;
    if (typeof newPageSize !== 'undefined' && pageSize !== newPageSize) {
      pagination = new Pagination({ page: 1, size: newPageSize });
    }
  }
</script>

{#if totalCount}
  <div class="pagination-group">
    <PaginationComponent
      total={totalCount}
      {pageSize}
      currentPage={page}
      on:change={handlePageChange}
    />
    <Select
      triggerAppearance="plain"
      options={pageSizeOpts}
      value={pageSize}
      on:change={setPageSize}
    />
  </div>
{/if}

<style lang="scss">
  .pagination-group {
    display: flex;
    align-items: center;
  }
</style>
