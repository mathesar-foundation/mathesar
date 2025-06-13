<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { _ } from 'svelte-i18n';

  import type { Result } from '@mathesar/api/rpc/records';
  import { extractPrimaryKeyValue } from '@mathesar/stores/table-data';
  import {
    ListBox,
    ListBoxOptions,
    Spinner,
  } from '@mathesar-component-library';
  import type { ListBoxApi } from '@mathesar-component-library/types';

  import type RowSeekerController from './RowSeekerController';
  import RowSeekerOption from './RowSeekerOption.svelte';

  const dispatch = createEventDispatcher<{ escape: never }>();

  export let controller: RowSeekerController;
  $: ({ elementId, records, columns } = controller);
  $: isLoading = $records.isLoading || $columns.isLoading;
  $: resolvedRecords = $records.resolvedValue;
  $: recordSummaries = resolvedRecords?.record_summaries ?? {};
  $: linkedRecordSummaries = resolvedRecords?.linked_record_summaries ?? {};
  $: recordsArray = resolvedRecords?.results ?? [];
  $: columnsArray = $columns.resolvedValue ?? [];

  let searchElement: HTMLInputElement | undefined;

  onMount(() => {
    //
  });

  function selectRecord(val: Result[]) {
    const record = val[0];
    controller.select({
      recordSummary:
        recordSummaries[extractPrimaryKeyValue(record, columnsArray)],
      record,
    });
  }

  function handleKeyDown(api: ListBoxApi<Result>, e: KeyboardEvent) {
    api.handleKeyDown(e);
    if (e.key === 'Escape') {
      dispatch('escape');
    }
  }

  function getTypeCastedOption(opt: unknown): Result {
    return opt as Result;
  }
</script>

<div id={elementId} tabindex="0" data-row-seeker>
  <ListBox
    selectionType="single"
    mode="static"
    options={recordsArray}
    on:change={(e) => selectRecord(e.detail)}
    let:api
  >
    <div data-row-seeker-search>
      <input
        class="search-bar"
        type="text"
        bind:this={searchElement}
        placeholder={$_('search')}
        on:keydown={(e) => handleKeyDown(api, e)}
      />
      <div class="spinner">
        {#if isLoading}
          <Spinner />
        {/if}
      </div>
      <div class="sub-actions"></div>
    </div>
    <div class="option-container">
      {#if recordsArray.length > 0 && columnsArray.length > 0}
        <ListBoxOptions
          class="option-list-box"
          let:option
          let:isSelected
          let:inFocus
        >
          {@const record = getTypeCastedOption(option)}
          <RowSeekerOption
            {isSelected}
            {inFocus}
            {record}
            summary={recordSummaries[
              extractPrimaryKeyValue(record, columnsArray)
            ]}
            columns={columnsArray}
            {linkedRecordSummaries}
          />
        </ListBoxOptions>
      {/if}
    </div>
  </ListBox>
</div>

<style lang="scss">
  div[data-row-seeker] {
    max-width: 45rem;
    overflow: hidden;
    position: relative;
  }

  [data-row-seeker-search] {
    display: grid;
    column-gap: 0.1rem;
    grid-template-columns: 1fr 2rem;
    border-bottom: 1px solid var(--border-color);

    .search-bar {
      border: none;
      padding: var(--input-padding);
      line-height: var(--input-line-height);

      &::placeholder {
        color: var(--text-color-tertiary);
      }

      &:focus {
        outline: 0;
        border-color: var(--input-focus-color);
      }
    }

    .spinner {
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }

  .option-container {
    overflow-x: hidden;
    overflow-y: auto;
    --list-box-options-padding: 0;

    :global(.option-list-box) {
      max-height: 25rem;
      overflow-y: auto;
    }
  }
</style>
