<script lang="ts">
  /**
   * Currently, not being used.
   * TODO: Come up with a limit for infinite scroll, and use pagination
   *       when limit exceeds.
   * Usage:
   *   <TablePagination id={identifier} {database}
   *      total={$records.totalCount}
   *      bind:pageSize={$options.pageSize}
   *      bind:page={$options.page}
   *      bind:offset={offset}
   *      on:change={refetch}/>
   */

  import { createEventDispatcher } from 'svelte';
  import { Pagination, Select } from '@mathesar-components';
  import URLQueryHandler from '@mathesar/utils/urlQueryHandler';

  const dispatch = createEventDispatcher();

  export let database: string;
  export let id: number;
  export let total: number;
  export let pageSize: number;
  export let page: number;
  export let offset = 0;

  const pageSizeOpts = [
    { id: 25, label: '25' },
    { id: 50, label: '50' },
    { id: 100, label: '100' },
  ];
  let selectedPageSize = pageSizeOpts[0];
  let pageCount: number;

  $: offset = (pageSize * (page - 1)) + 1;
  $: max = Math.min(total, offset + pageSize - 1);

  function getLink(_page: number, _pageSize: number): string {
    return `/${database}${URLQueryHandler.constructTableLink(id, {
      pageSize: _pageSize,
      page: _page,
    })}`;
  }

  function pageChanged(event: { detail: { originalEvent: Event, page: number, prevPage: number } }) {
    const { originalEvent, prevPage } = event.detail;
    originalEvent.preventDefault();
    if (prevPage !== event.detail.page) {
      dispatch('change');
    }
  }

  function setPageSize(event: { detail: { value: { id: number } } }) {
    const newPageSize = event.detail.value.id;
    if (newPageSize !== pageSize) {
      pageSize = newPageSize;
      page = 1;
      dispatch('change');
    }
  }

  function onPageSizeChange(_pagesize: number) {
    if (selectedPageSize?.id !== _pagesize) {
      const newPageSizeOption = pageSizeOpts.find((el) => el.id === _pagesize);
      if (newPageSizeOption) {
        selectedPageSize = newPageSizeOption;
      }
    }
  }

  $: onPageSizeChange(pageSize);
</script>

<Select options={pageSizeOpts} bind:value={selectedPageSize} on:change={setPageSize}/>

<div class="rt-opts">
  {#if pageCount > 0}
    <div>Showing {offset} - {max} of {total}</div>
  {/if}

  <Pagination total={total} pageSize={pageSize} {getLink}
    bind:page bind:pageCount on:change={pageChanged}/>
</div>
