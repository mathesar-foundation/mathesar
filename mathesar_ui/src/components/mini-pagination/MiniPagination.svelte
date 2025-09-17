<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { _ } from 'svelte-i18n';

  import Pagination from '@mathesar/utils/Pagination';
  import {
    Button,
    Dropdown,
    Icon,
    iconChooseItemNext,
    iconChooseItemPrevious,
  } from '@mathesar-component-library';

  import PageJumper from './PageJumper.svelte';

  export let pagination: Pagination;
  export let recordCount: number;
  export let pageJumperIsOpen = false;

  const dispatch = createEventDispatcher<{
    change: Pagination;
  }>();

  $: ({ page } = pagination);
  $: maxPage = pagination.getMaxPage(recordCount);
  $: canGoBackward = page > 1;
  $: canGoForward = page < maxPage;

  function goToPage(destination: number) {
    const nearestValidPage = Math.max(Math.min(destination, maxPage), 1);
    pagination = new Pagination({
      size: pagination.size,
      page: nearestValidPage,
    });
    dispatch('change', pagination);
  }

  function goBackward() {
    goToPage(page - 1);
  }

  function goForward() {
    goToPage(page + 1);
  }

  function handleDropdownOpen() {}
</script>

<div class="mini-pagination">
  {#if canGoBackward}
    <Button
      appearance="ghost"
      class="padding-zero"
      on:click={goBackward}
      tooltip={$_('previous_page')}
    >
      <span class="button">
        <Icon {...iconChooseItemPrevious} />
      </span>
    </Button>
  {/if}

  <Dropdown
    showArrow={false}
    triggerAppearance="ghost"
    triggerClass="padding-zero"
    placements={['bottom', 'bottom-end', 'bottom-start', 'left', 'top']}
    closeOnInnerClick={false}
    bind:isOpen={pageJumperIsOpen}
    on:open={handleDropdownOpen}
  >
    <span slot="trigger" class="button">
      {$_('page_number', { values: { pageNumber: page } })}
    </span>
    <div slot="content" class="detail" let:close>
      <PageJumper
        {pagination}
        {recordCount}
        goToPage={(destination) => {
          goToPage(destination);
          close();
        }}
      />
    </div>
  </Dropdown>

  <Button
    appearance="ghost"
    class="padding-zero"
    on:click={goForward}
    disabled={!canGoForward}
    tooltip={$_('next_page')}
  >
    <span class="button">
      <Icon {...iconChooseItemNext} />
    </span>
  </Button>
</div>

<style>
  .mini-pagination {
    display: grid;
    max-width: min-content;
    grid-auto-flow: column;
    --button-border: none;
  }
  .button {
    --size: 1.9em;
    height: var(--size);
    min-width: var(--size);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--sm5);
  }
  .button:hover {
    background: var(--color-navigation-20-hover);
  }
  .detail {
    padding: var(--sm1);
  }
</style>
