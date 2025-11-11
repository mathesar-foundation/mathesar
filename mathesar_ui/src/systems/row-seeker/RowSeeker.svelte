<script lang="ts">
  import { _ } from 'svelte-i18n';

  import type { SummarizedRecordReference } from '@mathesar/api/rpc/_common/commonTypes';
  import ErrorBox from '@mathesar/components/message-boxes/ErrorBox.svelte';
  import { MiniPagination } from '@mathesar/components/mini-pagination';
  import { RpcError } from '@mathesar/packages/json-rpc-client-builder';
  import {
    Button,
    ListBox,
    ListBoxOptions,
    Spinner,
  } from '@mathesar-component-library';
  import type { ListBoxApi } from '@mathesar-component-library/types';

  import type RowSeekerController from './RowSeekerController';
  import RowSeekerOption from './RowSeekerOption.svelte';
  import RowSeekerSearch from './RowSeekerSearch.svelte';

  export let controller: RowSeekerController;
  export let close: () => void = () => {};

  $: ({
    elementId,
    records,
    pagination,
    previousValue,
    canAddNewRecord,
    selectionType,
  } = controller);
  $: isLoading = $records.isLoading;
  $: resolvedRecords = $records.resolvedValue;
  $: recordsArray = resolvedRecords?.results ?? [];
  $: recordsCount = resolvedRecords?.count ?? 0;
  $: hasPagination = recordsCount > $pagination.size;
  $: showSelection = (() => {
    if (selectionType === 'multiple') {
      return Array.isArray(previousValue) && previousValue.length > 0;
    }
    if (!previousValue) return false;
    const singleValue = Array.isArray(previousValue)
      ? previousValue[0]
      : previousValue;
    if (!singleValue) return false;
    const { key } = singleValue;
    if (key === undefined) return false;
    if (key === null) return false;
    return true;
  })();

  let listBoxValue: SummarizedRecordReference[] | undefined = undefined;

  // Initialize listBoxValue from previousValue
  $: {
    if (selectionType === 'multiple') {
      listBoxValue = Array.isArray(previousValue) ? previousValue : [];
    } else {
      const singleValue = Array.isArray(previousValue)
        ? previousValue[0]
        : previousValue;
      listBoxValue = singleValue ? [singleValue] : undefined;
    }
  }

  function selectRecord(val: SummarizedRecordReference[]) {
    if (selectionType === 'multiple') {
      controller.select(val);
    } else {
      const result = val.at(0);
      controller.select(result ?? null);
    }
  }

  function handleKeyDown(
    api: ListBoxApi<SummarizedRecordReference>,
    e: KeyboardEvent,
  ) {
    if (e.key === 'Escape') {
      // In multiple mode, Escape just closes (selection already saved on each change)
      // In single mode, Escape cancels
      if (selectionType === 'multiple') {
        close();
      } else {
        controller.cancel();
        close();
      }
      return;
    }
    api.handleKeyDown(e);
  }

  async function handleAddNewButtonKeyDown(
    api: ListBoxApi<SummarizedRecordReference>,
    e: KeyboardEvent,
  ) {
    if (e.key === 'Escape') {
      controller.cancel();
      close();
      return;
    }
    if (e.key === 'Enter') {
      return;
    }
    await controller.focusSearch();
    api.handleKeyDown(e);
  }

  function getTypeCastedOption(opt: unknown): SummarizedRecordReference {
    return opt as SummarizedRecordReference;
  }
</script>

<div id={elementId} tabindex="0" data-row-seeker>
  <ListBox
    {selectionType}
    mode="static"
    bind:value={listBoxValue}
    options={recordsArray}
    on:change={(e) => selectRecord(e.detail)}
    on:pick={selectionType === 'single' ? close : undefined}
    checkEquality={(a, b) => a?.key === b?.key}
    let:api
  >
    <div data-row-seeker-controls>
      <RowSeekerSearch {controller} onKeyDown={(e) => handleKeyDown(api, e)} />
    </div>

    <div class="option-container">
      {#if recordsArray.length > 0}
        <ListBoxOptions
          class="option-list-box"
          let:option
          let:isSelected
          let:inFocus
        >
          {@const result = getTypeCastedOption(option)}
          <RowSeekerOption
            {showSelection}
            {controller}
            {isSelected}
            {inFocus}
            summary={result.summary}
          />
        </ListBoxOptions>
      {:else}
        <div class="empty-states">
          {#if isLoading}
            <div class="loading"><Spinner /></div>
          {:else if $records.error}
            <ErrorBox>
              {RpcError.fromAnything($records.error).message}
            </ErrorBox>
          {:else}
            <div class="no-results">{$_('no_records_found')}</div>
          {/if}
        </div>
      {/if}
    </div>

    {#if hasPagination || canAddNewRecord}
      <div class="footer">
        {#if canAddNewRecord}
          <div class="add-record">
            <Button
              appearance="secondary"
              on:click={() => controller.addNewRecord()}
              on:keydown={(e) => handleAddNewButtonKeyDown(api, e)}
            >
              {$_('add_new_record')}
            </Button>
          </div>
        {/if}
        {#if hasPagination}
          <div class="pagination">
            <MiniPagination
              bind:pagination={$pagination}
              on:change={() => controller.getRecords()}
              recordCount={recordsCount}
            />
          </div>
        {/if}
      </div>
    {/if}
  </ListBox>
</div>

<style lang="scss">
  div[data-row-seeker] {
    max-width: min(30rem, 90vw);
    overflow: hidden;
    position: relative;
  }

  [data-row-seeker-controls] {
    display: flex;
    overflow: hidden;
    gap: 0.1rem;
    border-bottom: 1px solid var(--color-border-raised-2);
    box-shadow: 0 1px 3px
      color-mix(in srgb, var(--color-shadow), transparent 10%);
    background: var(--color-bg-raised-2);
  }

  .empty-states {
    padding: var(--sm1) var(--sm2);
    max-height: 20rem;
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

  .no-results {
    color: var(--color-fg-base-muted);
  }

  .loading {
    padding: var(--sm5);
    display: grid;
    align-items: center;
    justify-content: center;
  }

  .footer {
    border-top: 1px solid var(--color-border-section);
    padding: var(--sm6);
    display: flex;
    align-items: center;
    font-size: var(--sm2);

    .pagination {
      margin-left: auto;
    }
  }
</style>
