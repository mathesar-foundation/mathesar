<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import {
    Pagination as PaginationComponent,
    Select,
  } from '@mathesar-component-library';
  import Pagination from '@mathesar/utils/Pagination';

  const dispatch = createEventDispatcher();

  export let pagination: Pagination;
  export let totalCount: number;
  export let pageSizeOptions = [100, 200, 500];
  export let hiddenWhenPossible = false;

  $: ({ size: pageSize, page } = pagination);
  $: possibleToHide = pageSize >= totalCount;
  $: hidden = possibleToHide && hiddenWhenPossible;

  function handlePageChange(event: {
    detail: {
      currentPage: number;
    };
  }) {
    pagination = new Pagination({
      ...pagination,
      page: event.detail.currentPage,
    });
    dispatch('change', pagination);
  }

  function setPageSize(event: CustomEvent<number | undefined>) {
    const newPageSize = event.detail;
    if (typeof newPageSize !== 'undefined' && pageSize !== newPageSize) {
      pagination = new Pagination({ page: 1, size: newPageSize });
      dispatch('change', pagination);
    }
  }
</script>

{#if totalCount && !hidden}
  <div class="pagination-group">
    <PaginationComponent
      total={totalCount}
      {pageSize}
      currentPage={page}
      on:change={handlePageChange}
    />
    {#if pageSizeOptions.length}
      <Select
        triggerAppearance="secondary"
        options={pageSizeOptions}
        value={pageSize}
        on:change={setPageSize}
      />
    {/if}
  </div>
{/if}

<style lang="scss">
  .pagination-group {
    display: flex;
    align-items: center;
  }
</style>
