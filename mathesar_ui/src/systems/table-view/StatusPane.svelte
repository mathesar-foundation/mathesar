<script lang="ts">
  import { getPaginationPageCount } from '@mathesar-component-library';
  import { States } from '@mathesar/utils/api';
  import { getTabularDataStoreFromContext } from '@mathesar/stores/table-data';
  import PaginationGroup from '@mathesar/components/PaginationGroup.svelte';

  const tabularData = getTabularDataStoreFromContext();

  $: ({ recordsData, meta } = $tabularData);
  $: ({ selectedRows, pagination } = meta);
  $: ({ size: pageSize, leftBound, rightBound } = $pagination);
  $: ({ totalCount, state, newRecords } = recordsData);
  $: recordState = $state;

  $: pageCount = getPaginationPageCount($totalCount ?? 0, pageSize);
  $: max = Math.min($totalCount ?? 0, rightBound);
</script>

<div class="status-pane">
  <div class="record-count">
    {#if $selectedRows?.size > 0}
      {$selectedRows.size} record{$selectedRows.size > 1 ? 's' : ''} selected of
      {$totalCount}
    {:else if pageCount > 0 && $totalCount}
      Showing {leftBound} to {max}
      {#if $newRecords.length > 0}
        (+ {$newRecords.length} new record{$newRecords.length > 1 ? 's' : ''})
      {/if}
      of {$totalCount} records
    {:else if recordState !== States.Loading}
      No records found
    {/if}
  </div>

  <PaginationGroup
    bind:pagination={$pagination}
    totalCount={$totalCount ?? 0}
  />
</div>

<style>
  .status-pane {
    padding: 3px 12px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-top: 1px solid #efefef;
    position: relative;
    flex-shrink: 0;
    flex-basis: 35px;
    background: #f7f8f8;
  }
</style>
