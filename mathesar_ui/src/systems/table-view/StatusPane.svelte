<script lang="ts">
  import {
    getPaginationPageCount,
    Button,
    Icon,
    iconError,
  } from '@mathesar-component-library';
  import { States } from '@mathesar/api/utils/requestUtils';
  import { getTabularDataStoreFromContext } from '@mathesar/stores/table-data';
  import PaginationGroup from '@mathesar/components/PaginationGroup.svelte';
  import { iconAddNew, iconRefresh } from '@mathesar/icons';

  const tabularData = getTabularDataStoreFromContext();

  export let context: 'page' | 'widget' = 'page';

  $: ({ recordsData, meta, isLoading, columnsDataStore, constraintsDataStore } =
    $tabularData);
  $: ({ pagination } = meta);
  $: ({ size: pageSize, leftBound, rightBound } = $pagination);
  $: ({ totalCount, state, newRecords } = recordsData);
  $: recordState = $state;
  $: columnsFetchStatus = columnsDataStore.fetchStatus;
  $: pageCount = getPaginationPageCount($totalCount ?? 0, pageSize);
  $: max = Math.min($totalCount ?? 0, rightBound);
  $: isError =
    $columnsFetchStatus?.state === 'failure' ||
    recordState === States.Error ||
    $constraintsDataStore.state === States.Error;
  $: hasNewRecordButton = context === 'page';

  function refresh() {
    void $tabularData.refresh();
  }
</script>

<div
  class="status-pane"
  class:context-widget={context === 'widget'}
  class:context-page={context === 'page'}
>
  <div class="status-pane-items-section">
    {#if hasNewRecordButton}
      <Button
        disabled={$isLoading}
        size="medium"
        appearance="primary"
        on:click={() => recordsData.addEmptyRecord()}
      >
        <Icon {...iconAddNew} />
        <span>New Record</span>
      </Button>
    {/if}
    <div class="record-count">
      <!-- TODO: Check with team if we need this now? -->
      <!-- {#if $selectedRows?.size > 0}
        {$selectedRows.size} record{$selectedRows.size > 1 ? 's' : ''} selected of
        {$totalCount}
      {:else if pageCount > 0 && $totalCount} -->
      {#if pageCount > 0 && $totalCount}
        Showing {leftBound} to {max}
        {#if $newRecords.length > 0}
          (+ {$newRecords.length} new record{$newRecords.length > 1 ? 's' : ''})
        {/if}
        of {$totalCount} records
      {:else if recordState !== States.Loading}
        No records found
      {/if}
    </div>
  </div>

  <div class="status-pane-items-section">
    <PaginationGroup
      bind:pagination={$pagination}
      totalCount={$totalCount ?? 0}
      pageSizeOptions={context === 'widget' ? [] : undefined}
      hiddenWhenPossible={context === 'widget'}
    />
    <Button
      appearance="secondary"
      size="medium"
      disabled={$isLoading}
      on:click={refresh}
    >
      <Icon
        {...isError && !isLoading ? iconError : iconRefresh}
        spin={$isLoading}
      />
      <span>
        {#if $isLoading}
          Loading
        {:else if isError}
          Retry
        {:else}
          Refresh
        {/if}
      </span>
    </Button>
  </div>
</div>

<style lang="scss">
  .status-pane {
    padding: 0.5rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-top: 1px solid var(--color-gray-medium);
    position: relative;
    flex-shrink: 0;
    flex-basis: 32px;

    &.context-page {
      background-color: var(--slate-100);
    }

    &.context-widget {
      font-size: 80%;
    }
  }

  .status-pane-items-section {
    display: flex;
    flex-direction: row;
    align-items: center;

    > :global(* + *) {
      margin-left: 1rem;
    }
  }
</style>
