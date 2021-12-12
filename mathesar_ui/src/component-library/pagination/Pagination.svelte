<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import {
    faAngleDoubleLeft,
    faAngleDoubleRight,
    faEllipsisH,
    faAngleLeft,
    faAngleRight,
  } from '@fortawesome/free-solid-svg-icons';
  import { Icon } from '@mathesar-component-library';
  import { calculatePages } from './paginationUtils';

  const dispatch = createEventDispatcher();

  /**
   * The active page number.
   * @required
   */
  export let page = 1;

  // Number of records per page.
  export let pageSize = 10;

  /**
   * Total number of records.
   * @required
   */
  export let total = 0;

  // Can be used to specify a path.
  export let getLink: (page: number, pageSize: number) => string = null;

  // Total number of pages.
  export let pageCount = 0;

  $: pageCount = Math.ceil(total / pageSize);
  $: pageInfo = calculatePages(page, pageCount);

  function setPage(e: Event, _page: number) {
    if (_page > 0 && _page <= pageCount && page !== _page) {
      page = _page;
      dispatch('change', {
        page,
        originalEvent: e,
      });
    }
  }
</script>

<ul class="pagination">
  {#if pageCount > 1}
    <li>
      <span tabindex="0" on:click={(e) => setPage(e, page - 1)}>
        <Icon data={faAngleLeft}/>
      </span>
    </li>
  {/if}

  {#if pageInfo.start > 1}
    <li class:active={page === pageInfo.start}>
      {#if getLink}
        <a tabindex="0" class="page" href={getLink(1, pageSize)}
            on:click={(e) => setPage(e, 1)} data-tinro-ignore>
          1
        </a>
      {:else}
        <span tabindex="0" class="page" on:click={(e) => setPage(e, 1)}>
          1
        </span>
      {/if}
    </li>
    {#if pageInfo.start > 2}
      <li>
        <span tabindex="0" on:click={(e) => setPage(e, pageInfo.prevPageWindow)}>
          <Icon class="ellipsis" data={faEllipsisH}/>
          <Icon class="arrow" data={faAngleDoubleLeft}/>
        </span>
      </li>
    {/if}
  {/if}

  {#each pageInfo.pages as _page (_page)}
    <li class:active={page === _page}>
      {#if getLink}
        <a tabindex="0" class="page" href={getLink(_page, pageSize)}
            on:click={(e) => setPage(e, _page)} data-tinro-ignore>
          {_page}
        </a>
      {:else}
        <span tabindex="0" class="page" on:click={(e) => setPage(e, _page)}>
          {_page}
        </span>
      {/if}
    </li>
  {/each}

  {#if pageInfo.end < pageCount}
    {#if pageInfo.end < pageCount - 1}
      <li>
        <span tabindex="0" on:click={(e) => setPage(e, pageInfo.nextPageWindow)}>
          <Icon class="ellipsis" data={faEllipsisH}/>
          <Icon class="arrow" data={faAngleDoubleRight}/>
        </span>
      </li>
    {/if}
    <li class:active={page === pageInfo.end}>
      {#if getLink}
        <a tabindex="0" class="page" href={getLink(pageCount, pageSize)}
            on:click={(e) => setPage(e, pageCount)} data-tinro-ignore>
          {pageCount}
        </a>
      {:else}
        <span tabindex="0" class="page" on:click={(e) => setPage(e, pageCount)}>
          {pageCount}
        </span>
      {/if}
    </li>
  {/if}

  {#if pageCount > 1}
    <li>
      <span tabindex="0" on:click={(e) => setPage(e, page + 1)}>
        <Icon data={faAngleRight}/>
      </span>
    </li>
  {/if}
</ul>

<style global lang="scss">
  @import "Pagination.scss";
</style>
