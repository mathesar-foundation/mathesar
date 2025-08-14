<script lang="ts">
  import { _ } from 'svelte-i18n';

  import type { SummarizedRecordReference } from '@mathesar/api/rpc/_common/commonTypes';
  import ErrorBox from '@mathesar/components/message-boxes/ErrorBox.svelte';
  import { MiniPagination } from '@mathesar/components/mini-pagination';
  import { RpcError } from '@mathesar/packages/json-rpc-client-builder';
  import {
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

  $: ({ elementId, records, pagination, previousValue } = controller);
  $: isLoading = $records.isLoading;
  $: resolvedRecords = $records.resolvedValue;
  $: recordsArray = resolvedRecords?.results ?? [];
  $: recordsCount = resolvedRecords?.count ?? 0;
  $: hasPagination = recordsCount > $pagination.size;
  $: showSelection = (() => {
    if (!previousValue) return false;
    const { key } = previousValue;
    if (key === undefined) return false;
    if (key === null) return false;
    return true;
  })();

  function selectRecord(val: SummarizedRecordReference[]) {
    const result = val.at(0);
    if (!result) return;
    controller.select(result);
  }

  function handleKeyDown(
    api: ListBoxApi<SummarizedRecordReference>,
    e: KeyboardEvent,
  ) {
    if (e.key === 'Escape') {
      close();
      return;
    }
    api.handleKeyDown(e);
  }

  function getTypeCastedOption(opt: unknown): SummarizedRecordReference {
    return opt as SummarizedRecordReference;
  }
</script>

<div id={elementId} tabindex="0" data-row-seeker>
  <ListBox
    selectionType="single"
    mode="static"
    value={previousValue ? [previousValue] : undefined}
    options={recordsArray}
    on:change={(e) => selectRecord(e.detail)}
    on:pick={close}
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

    {#if hasPagination}
      <div class="pagination">
        <MiniPagination
          bind:pagination={$pagination}
          on:change={() => controller.getRecords()}
          recordCount={recordsCount}
        />
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
    border-bottom: 1px solid var(--border-color);
    box-shadow:
      0 1px 2px rgba(0, 0, 0, 0.05),
      0 1px 3px rgba(0, 0, 0, 0.1),
      0 1px 2px -1px rgba(0, 0, 0, 0.1);
    background: var(--input-background);
  }

  .empty-states {
    padding: var(--sm4) var(--sm2);
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
    color: var(--text-color-muted);
  }

  .loading {
    padding: var(--sm5);
    display: grid;
    align-items: center;
    justify-content: center;
  }

  .pagination {
    border-top: 1px solid var(--border-color);
    padding: var(--sm6);
    display: flex;
    align-items: center;
    justify-content: end;
    font-size: var(--sm2);
  }
</style>
