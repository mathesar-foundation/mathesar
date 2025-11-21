<script lang="ts">
  import { type Writable, get } from 'svelte/store';
  import { _ } from 'svelte-i18n';

  import type { RecordsSummaryListResponse } from '@mathesar/api/rpc/_common/commonTypes';
  import ErrorBox from '@mathesar/components/message-boxes/ErrorBox.svelte';
  import { MiniPagination } from '@mathesar/components/mini-pagination';
  import { RpcError } from '@mathesar/packages/json-rpc-client-builder';
  import { toast } from '@mathesar/stores/toast';
  import { getErrorMessage } from '@mathesar/utils/errors';
  import { Spinner } from '@mathesar-component-library';

  import type MultiTaggerController from './MultiTaggerController';
  import type { MultiTaggerOption } from './MultiTaggerOption';
  import MultiTaggerRow from './MultiTaggerRow.svelte';
  import MultiTaggerSearch from './MultiTaggerSearch.svelte';
  import { addMapping, getOptions, removeMapping } from './multiTaggerUtils';

  export let controller: MultiTaggerController;
  export let close: () => void;

  $: ({ elementId, records, searchValue, pagination } = controller);
  $: resolvedRecords = $records.resolvedValue;
  $: recordsCount = resolvedRecords?.count ?? 0;
  $: hasPagination = recordsCount > $pagination.size;

  let options: Writable<MultiTaggerOption>[] = [];
  let selectedIndex: number | undefined;

  function handleRefresh(response: RecordsSummaryListResponse | undefined) {
    options = [...getOptions(response)];
    selectedIndex = undefined;
  }

  $: handleRefresh(resolvedRecords);

  function focusSearch() {
    const componentElement = document.getElementById(elementId);
    const searchBox = componentElement?.querySelector<HTMLElement>(
      '[data-multi-tagger-search-box]',
    );
    searchBox?.focus?.();
  }

  async function toggle(index: number) {
    const option = options.at(index);
    if (!option) return;
    option.update((o) => o.asLoading());
    const { key, mappingId } = get(option);
    try {
      if (mappingId === undefined) {
        const newMappingId = await addMapping(controller, key);
        option.update((o) => o.withMapping(newMappingId));
      } else {
        await removeMapping(controller, mappingId);
        option.update((o) => o.withoutMapping());
      }
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
    option.update((o) => o.asNotLoading());
    focusSearch();
  }

  function selectIndex(i: number) {
    selectedIndex = i;
  }

  function selectNext() {
    if (selectedIndex === undefined) {
      selectedIndex = 0;
      return;
    }
    selectedIndex = Math.min(selectedIndex + 1, options.length - 1);
  }

  function selectPrevious() {
    if (selectedIndex === undefined) {
      selectedIndex = 0;
      return;
    }
    selectedIndex = Math.max(selectedIndex - 1, 0);
  }

  function toggleSelected() {
    if (!selectedIndex) return;
    void toggle(selectedIndex);
  }

  function handleKeyDown(e: KeyboardEvent) {
    new Map([
      ['Escape', close],
      ['ArrowUp', selectPrevious],
      ['ArrowDown', selectNext],
      ['Enter', toggleSelected],
    ]).get(e.key)?.();
  }
</script>

<div id={elementId} tabindex="0" data-multi-tagger>
  <div class="search">
    <MultiTaggerSearch {controller} onKeyDown={handleKeyDown} />
  </div>

  {#if $records.isInitializing}
    <div class="padded"><Spinner /></div>
  {:else if $records.error}
    <ErrorBox>{RpcError.fromAnything($records.error).message}</ErrorBox>
  {:else}
    <div class="results">
      {#each options as option, index}
        <MultiTaggerRow
          {option}
          selected={index === selectedIndex}
          searchValue={$searchValue}
          onToggle={() => {
            void toggle(index);
          }}
          onHover={() => selectIndex(index)}
        />
      {:else}
        <div class="no-results padded">{$_('no_records_found')}</div>
      {/each}
    </div>

    {#if hasPagination}
      <div class="footer">
        <div class="pagination">
          <MiniPagination
            bind:pagination={$pagination}
            on:change={() => controller.getRecords()}
            recordCount={recordsCount}
          />
        </div>
      </div>
    {/if}
  {/if}
</div>

<style lang="scss">
  div[data-multi-tagger] {
    max-width: min(30rem, 90vw);
    max-height: inherit;
    overflow: hidden;
    position: relative;
    display: grid;
    grid-template-rows: auto 1fr auto;
  }
  .search {
    border-bottom: 1px solid var(--color-border-raised-2);
    box-shadow: 0 1px 3px
      color-mix(in srgb, var(--color-shadow), transparent 10%);
    background: var(--color-bg-raised-2);
  }
  .padded {
    padding: var(--sm1);
    display: grid;
    align-items: center;
    justify-content: center;
  }
  .results {
    overflow-x: hidden;
    overflow-y: scroll;
  }
  .no-results {
    color: var(--color-fg-base-muted);
  }
  .footer {
    border-top: 1px solid var(--color-border-section);
    padding: var(--sm6);
    display: flex;
    align-items: center;
    font-size: var(--sm2);
  }
  .pagination {
    margin-left: auto;
  }
</style>
