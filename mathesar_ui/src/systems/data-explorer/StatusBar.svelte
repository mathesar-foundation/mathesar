<script lang="ts">
  import { _ } from 'svelte-i18n';

  import PaginationGroup from '@mathesar/components/PaginationGroup.svelte';

  import type QueryManager from './QueryManager';
  import type { QueryRunner } from './QueryRunner';
  import QueryRefreshButton from './result-pane/QueryRefreshButton.svelte';

  export let queryHandler: QueryRunner | QueryManager;

  $: ({ rowsData, pagination, runState } = queryHandler);
  $: recordRunState = $runState?.state;
  $: totalCount = $rowsData.totalCount;
</script>

<div data-identifier="status-bar">
  {#if totalCount}
    <div>
      {$_('showing_n_to_m_of_total', {
        values: {
          leftBound: $pagination.leftBound,
          rightBound: Math.min(totalCount, $pagination.rightBound),
          totalCount,
        },
      })}
    </div>
  {:else if recordRunState === 'success'}
    {$_('no_results_found')}
  {/if}
  <div class="pagination-controls">
    <PaginationGroup
      pagination={$pagination}
      {totalCount}
      on:change={(e) => {
        void queryHandler.setPagination(e.detail);
      }}
    />
    <div class="refresh">
      <QueryRefreshButton queryRunner={queryHandler} />
    </div>
  </div>
</div>

<style>
  [data-identifier='status-bar'] {
    flex-grow: 0;
    flex-shrink: 0;
    border-top: 1px solid var(--slate-300);
    background-color: var(--slate-100);
    padding: 0.2rem 0.6rem;
    display: flex;
    align-items: center;
  }

  .pagination-controls {
    margin-left: auto;
    display: flex;
    align-items: center;
  }

  .refresh {
    margin-left: var(--size-xx-small);
  }
</style>
