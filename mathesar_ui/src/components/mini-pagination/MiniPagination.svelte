<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { _ } from 'svelte-i18n';

  import Select from '@mathesar/component-library/select/Select.svelte';
  import Pagination from '@mathesar/utils/Pagination';
  import {
    Button,
    Dropdown,
    Icon,
    LabeledInput,
    iconChooseItemNext,
    iconChooseItemPrevious,
  } from '@mathesar-component-library';

  import PageJumper from './PageJumper.svelte';

  export let pagination: Pagination;
  export let recordCount: number;
  export let pageJumperIsOpen = false;
  export let pageSizeOptions: number[] | undefined = undefined;

  const dispatch = createEventDispatcher<{
    change: Pagination;
  }>();

  $: ({ page, size } = pagination);
  $: maxPage = pagination.getMaxPage(recordCount);
  $: canGoBackward = page > 1;
  $: canGoForward = page < maxPage;
  $: allPageSizeOptions = (() => {
    if (pageSizeOptions === undefined) return undefined;
    if (pageSizeOptions.length < 2) return undefined;
    const uniqueOptions = new Set([...pageSizeOptions, size]);
    return [...uniqueOptions].sort((a, b) => a - b);
  })();

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

      {#if allPageSizeOptions}
        <div class="page-size">
          <LabeledInput label={$_('page_size')}>
            <Select
              options={allPageSizeOptions}
              value={size}
              on:change={({ detail: newSize }) => {
                changePageSize(newSize ?? allPageSizeOptions[0]);
                close();
              }}
            />
          </LabeledInput>
        </div>
      {/if}
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
  .page-size {
    margin-top: 1em;
    font-size: var(--sm1);
  }
</style>
