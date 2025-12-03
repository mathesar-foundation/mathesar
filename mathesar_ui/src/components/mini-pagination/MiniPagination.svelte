<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { _ } from 'svelte-i18n';

  import Select from '@mathesar/component-library/select/Select.svelte';
  import Pagination from '@mathesar/utils/Pagination';
  import {
    AttachableDropdown,
    Button,
    Icon,
    LabeledInput,
    iconChooseItemNext,
    iconChooseItemPrevious,
    iconExpandDown,
  } from '@mathesar-component-library';

  import PageJumper from './PageJumper.svelte';

  const dispatch = createEventDispatcher<{
    change: Pagination;
  }>();
  const numberFormatter = new Intl.NumberFormat();

  export let pagination: Pagination;
  export let recordCount: number;
  export let pageJumperIsOpen = false;
  export let pageSizeOptions: number[] | undefined = undefined;
  export let showTotalPages = false;
  export let hasDropdownIndicator = true;

  let pageJumperTriggerElement: HTMLElement;

  $: ({ page, size } = pagination);
  $: maxPage = pagination.getMaxPage(recordCount);
  $: hasBackButton = page > 1;
  $: hasForwardButton = page < maxPage;
  $: allPageSizeOptions = (() => {
    if (pageSizeOptions === undefined) return undefined;
    if (pageSizeOptions.length < 2) return undefined;
    const uniqueOptions = new Set([...pageSizeOptions, size]);
    return [...uniqueOptions].sort((a, b) => a - b);
  })();

  function togglePageJumper() {
    pageJumperIsOpen = !pageJumperIsOpen;
  }

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

  function changePageSize(newSize: number) {
    pagination = new Pagination({
      size: newSize,
      page: pagination.page,
    });
    dispatch('change', pagination);
  }
</script>

<div class="mini-pagination">
  {#if hasBackButton}
    <Button on:click={goBackward}>
      <Icon {...iconChooseItemPrevious} />
    </Button>
  {/if}
  <Button on:click={togglePageJumper} bind:element={pageJumperTriggerElement}>
    <span class="label">
      {#if showTotalPages}
        {$_('page_number_of_total_pages', {
          values: {
            pageNumber: page,
            totalPages: numberFormatter.format(maxPage),
          },
        })}
      {:else}
        {$_('page_number', { values: { pageNumber: page } })}
      {/if}
    </span>
    {#if hasDropdownIndicator && maxPage > 2}
      <Icon {...iconExpandDown} size="0.75em" />
    {/if}
  </Button>
  {#if hasForwardButton}
    <Button on:click={goForward}>
      <Icon {...iconChooseItemNext} />
    </Button>
  {/if}
</div>

<AttachableDropdown
  trigger={pageJumperTriggerElement}
  bind:isOpen={pageJumperIsOpen}
  placements={['bottom', 'bottom-end', 'bottom-start', 'left', 'top']}
  let:close
>
  <div class="jumper">
    <PageJumper
      {pagination}
      {recordCount}
      goToPage={(destination) => {
        goToPage(destination);
        close();
      }}
    />
    {#if allPageSizeOptions}
      <div class="page-size">
        <LabeledInput label={$_('page_size')}>
          <Select
            options={allPageSizeOptions}
            value={size}
            on:change={({ detail: newSize }) => {
              if (!newSize) return;
              changePageSize(newSize);
              close();
            }}
          />
        </LabeledInput>
      </div>
    {/if}
  </div>
</AttachableDropdown>

<style>
  .mini-pagination {
    display: grid;
    grid-auto-flow: column;
    isolation: isolate;
  }
  .mini-pagination > :global(*) {
    border-right: none;
    border-radius: 0;
    position: relative;
    z-index: 1;
  }
  .mini-pagination > :global(*:hover) {
    border-right: none !important;
    z-index: 2;
  }
  .mini-pagination > :global(:last-child) {
    border-right: solid 1px var(--color-border-control) !important;
    border-bottom-right-radius: var(--sm4);
    border-top-right-radius: var(--sm4);
  }
  .mini-pagination > :global(:first-child) {
    border-top-left-radius: var(--sm4);
    border-bottom-left-radius: var(--sm4);
  }
  .label {
    font-weight: normal;
  }
  .page-size {
    margin-top: 1em;
    font-size: var(--sm1);
    display: grid;
    justify-content: center;
  }
  .jumper {
    padding: var(--sm4) var(--sm4) var(--sm1) var(--sm4);
  }
</style>
