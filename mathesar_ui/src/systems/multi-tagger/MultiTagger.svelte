<script lang="ts">
  import { _ } from 'svelte-i18n';

  import ErrorBox from '@mathesar/components/message-boxes/ErrorBox.svelte';
  import { MiniPagination } from '@mathesar/components/mini-pagination';
  import { RpcError } from '@mathesar/packages/json-rpc-client-builder';
  import { Button, Spinner } from '@mathesar-component-library';

  import type MultiTaggerController from './MultiTaggerController';
  import MultiTaggerOption from './MultiTaggerOption.svelte';
  import MultiTaggerSearch from './MultiTaggerSearch.svelte';

  export let controller: MultiTaggerController;
  export let close: () => void;

  $: ({ elementId, records, pagination, searchValue } = controller);
  $: isLoading = $records.isLoading;
  $: resolvedRecords = $records.resolvedValue;
  $: recordsArray = resolvedRecords?.results ?? [];
  $: recordsCount = resolvedRecords?.count ?? 0;
  $: joinTable = resolvedRecords?.mapping?.join_table;
  $: joinedValues = new Map(
    Object.entries(resolvedRecords?.mapping?.joined_values ?? {}),
  );
  $: hasPagination = recordsCount > $pagination.size;

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      close();
      return;
    }
  }

  async function handleAddNewButtonKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      close();
      return;
    }
    if (e.key === 'Enter') {
      return;
    }
    await controller.focusSearch();
  }
</script>

<div id={elementId} tabindex="0" data-multi-tagger>
  <div data-multi-tagger-controls>
    <MultiTaggerSearch
      {controller}
      onKeyDown={(e) => {
        throw new Error('Not implemented');
      }}
    />
  </div>

  <div class="option-container">
    {#each recordsArray as record (record.key)}
      <MultiTaggerOption
        searchValue={$searchValue}
        {joinTable}
        joinValue={joinedValues.get(String(record.key))}
        summary={record.summary}
      />
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
</div>

<style lang="scss">
  div[data-multi-tagger] {
    max-width: min(30rem, 90vw);
    overflow: hidden;
    position: relative;
  }

  [data-multi-tagger-controls] {
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
