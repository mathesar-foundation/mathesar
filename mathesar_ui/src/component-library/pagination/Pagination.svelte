<script lang="ts">
  import { tick, createEventDispatcher } from 'svelte';
  import { Button, Icon } from '@mathesar-component-library';
  import {
    iconChooseItemPrevious,
    iconShowMore,
    iconChooseItemManyPrior,
    iconChooseItemManyAhead,
    iconChooseItemNext,
  } from '@mathesar-component-library-dir/common/icons';
  import { calculatePages, getPageCount } from './paginationUtils';

  const dispatch = createEventDispatcher();

  // The active page number.
  export let currentPage = 1;

  // Number of records per page.
  export let pageSize = 10;

  /**
   * Total number of records.
   * @required
   */
  export let total = 0;

  // Can be used to specify a path.
  export let getLink: ((page: number, pageSize: number) => string) | undefined =
    undefined;

  // ARIA Label for component
  export let ariaLabel = 'Pagination';

  $: pageCount = getPageCount(total, pageSize);
  $: pageInfo = calculatePages(currentPage, pageCount);

  async function setPage(e: Event, _page: number) {
    if (_page > 0 && _page <= pageCount && currentPage !== _page) {
      currentPage = _page;
      dispatch('change', {
        currentPage,
        originalEvent: e,
      });
    }
    await tick();
    const pagebutton = document.querySelector(`[data-page="${currentPage}"]`);
    (pagebutton as HTMLElement)?.focus();
  }
</script>

<nav aria-label={ariaLabel}>
  <ul class="pagination">
    {#if pageCount > 1}
      <li>
        <Button
          appearance="plain"
          tabindex="0"
          role="link"
          aria-label="Previous"
          on:click={(e) => setPage(e, currentPage - 1)}
          disabled={currentPage === 1}
        >
          <Icon {...iconChooseItemPrevious} tabindex="-1" />
        </Button>
      </li>
    {/if}

    {#if pageInfo.start > 1}
      <li>
        {#if getLink}
          <a
            tabindex="0"
            aria-label="Goto Page 1"
            class="page"
            href={getLink(1, pageSize)}
            on:click={(e) => setPage(e, 1)}
            data-tinro-ignore
          >
            1
          </a>
        {:else}
          <Button
            tabindex="0"
            appearance="secondary"
            role="link"
            aria-label="Goto Page 1"
            class="page"
            on:click={(e) => setPage(e, 1)}
          >
            1
          </Button>
        {/if}
      </li>
      {#if pageInfo.start > 2}
        <li>
          <Button
            tabindex="0"
            role="link"
            appearance="plain"
            aria-label="Goto Page {pageInfo.prevPageWindow}"
            on:click={(e) => setPage(e, pageInfo.prevPageWindow)}
          >
            <span>
              <Icon class="ellipsis" {...iconShowMore} />
              <Icon class="arrow" {...iconChooseItemManyPrior} />
            </span>
          </Button>
        </li>
      {/if}
    {/if}

    {#each pageInfo.currentWindow as _page (_page)}
      <li class:active={currentPage === _page}>
        {#if getLink}
          <a
            tabindex="0"
            class="page"
            href={getLink(_page, pageSize)}
            aria-label={currentPage === _page
              ? `Current Page, Page ${currentPage}`
              : `Goto Page ${_page}`}
            aria-selected={currentPage === _page}
            on:click={(e) => setPage(e, _page)}
            data-page={_page}
            data-tinro-ignore
          >
            {_page}
          </a>
        {:else}
          <Button
            tabindex="0"
            appearance="secondary"
            role="link"
            aria-label={currentPage === _page
              ? `Current Page, Page ${currentPage}`
              : `Goto Page ${_page}`}
            class="page"
            on:click={(e) => setPage(e, _page)}
            data-page={_page}
            aria-selected={currentPage === _page}
          >
            {_page}
          </Button>
        {/if}
      </li>
    {/each}

    {#if pageInfo.end < pageCount}
      {#if pageInfo.end < pageCount - 1}
        <li>
          <Button
            tabindex="0"
            appearance="plain"
            role="link"
            aria-label="Goto Page {pageInfo.nextPageWindow}"
            on:click={(e) => setPage(e, pageInfo.nextPageWindow)}
          >
            <span>
              <Icon class="ellipsis" {...iconShowMore} />
              <Icon class="arrow" {...iconChooseItemManyAhead} />
            </span>
          </Button>
        </li>
      {/if}
      <li>
        {#if getLink}
          <a
            tabindex="0"
            class="page"
            aria-label="Goto Page {pageCount}"
            href={getLink(pageCount, pageSize)}
            on:click={(e) => setPage(e, pageCount)}
            data-tinro-ignore
          >
            {pageCount}
          </a>
        {:else}
          <Button
            tabindex="0"
            appearance="secondary"
            class="page"
            role="link"
            aria-label="Goto Page {pageCount}"
            on:click={(e) => setPage(e, pageCount)}
          >
            {pageCount}
          </Button>
        {/if}
      </li>
    {/if}

    {#if pageCount > 1}
      <li>
        <Button
          tabindex="0"
          appearance="plain"
          role="link"
          aria-label="Next"
          on:click={(e) => setPage(e, currentPage + 1)}
          disabled={currentPage === pageCount}
        >
          <Icon {...iconChooseItemNext} />
        </Button>
      </li>
    {/if}
  </ul>
</nav>
