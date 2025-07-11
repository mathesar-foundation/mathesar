<script lang="ts">
  import { _ } from 'svelte-i18n';

  import { States } from '@mathesar/api/rest/utils/requestUtils';
  import PaginationGroup from '@mathesar/components/PaginationGroup.svelte';
  import RefreshButton from '@mathesar/components/RefreshButton.svelte';
  import { iconAddNew } from '@mathesar/icons';
  import { getTabularDataStoreFromContext } from '@mathesar/stores/table-data';
  import {
    Button,
    Icon,
    getPaginationPageCount,
  } from '@mathesar-component-library';

  const tabularData = getTabularDataStoreFromContext();

  export let context: 'page' | 'widget' | 'shared-consumer-page' = 'page';

  $: ({
    recordsData,
    meta,
    isLoading,
    columnsDataStore,
    constraintsDataStore,
    canInsertRecords,
  } = $tabularData);
  $: ({ pagination } = meta);
  $: ({ size: pageSize, leftBound, rightBound } = $pagination);
  $: ({ totalCount, state, newRecords, persistedNewRecords } = recordsData);
  $: recordState = $state;
  $: columnsFetchStatus = columnsDataStore.fetchStatus;
  $: pageCount = getPaginationPageCount($totalCount ?? 0, pageSize);
  $: max = Math.min($totalCount ?? 0, rightBound);
  $: isError =
    $columnsFetchStatus?.state === 'failure' ||
    recordState === States.Error ||
    $constraintsDataStore.state === States.Error;
  $: hasNewRecordButton = context !== 'widget' && $canInsertRecords;
  $: refreshButtonState = (() => {
    let buttonState: 'loading' | 'error' | undefined = undefined;
    if ($isLoading) {
      buttonState = 'loading';
    }
    if (isError) {
      buttonState = 'error';
    }
    return buttonState;
  })();

  function refresh() {
    void $tabularData.refresh();
  }
</script>

<div
  class="status-pane"
  class:context-widget={context === 'widget'}
  class:context-page={context === 'page'}
  class:context-shared-consumer-page={context === 'shared-consumer-page'}
>
  <div class="status-pane-items-section">
    {#if hasNewRecordButton}
      <Button
        disabled={$isLoading}
        size="medium"
        appearance="primary"
        on:click={() => $tabularData.addEmptyRecord()}
      >
        <Icon {...iconAddNew} />
        <span>{$_('new_record')}</span>
      </Button>
    {/if}
    <div class="record-count">
      {#if pageCount > 0 && $totalCount}
        <span>
          {$_('showing_n_to_m_of_total_records', {
            values: {
              leftBound,
              rightBound: max,
              totalCount: $totalCount,
            },
          })}
        </span>
        {#if $persistedNewRecords.length > 0}
          <span class="pill">
            {$_('count_new_records', {
              values: {
                count: $persistedNewRecords.length,
              },
            })}
          </span>
        {/if}
        {#if $newRecords.length - $persistedNewRecords.length > 0}
          <span class="pill">
            {$_('count_unsaved_records', {
              values: {
                count: $newRecords.length - $persistedNewRecords.length,
              },
            })}
          </span>
        {/if}
      {:else if recordState !== States.Loading}
        {$_('no_records_found')}
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
    <RefreshButton on:click={refresh} state={refreshButtonState} />
  </div>
</div>

<style lang="scss">
  .status-pane {
    padding: var(--status-bar-padding);
    display: flex;
    align-items: center;
    justify-content: space-between;
    position: relative;
    flex-shrink: 0;
    flex-basis: 32px;

    &.context-widget {
      font-size: 80%;
    }

    .record-count {
      display: inline-flex;
      align-items: center;
      gap: var(--sm5);
    }

    .pill {
      font-size: var(--sm2);
      display: inline-block;
      border: 1px solid var(--gray-400);
      border-radius: var(--border-radius-m);
      padding: var(--sm6);
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
