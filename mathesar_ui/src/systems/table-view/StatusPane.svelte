<script lang="ts">
  import { _ } from 'svelte-i18n';

  import { States } from '@mathesar/api/rest/utils/requestUtils';
  import { MiniPagination } from '@mathesar/components/mini-pagination';
  import RefreshButton from '@mathesar/components/RefreshButton.svelte';
  import { iconAddNew } from '@mathesar/icons';
  import { getTabularDataStoreFromContext } from '@mathesar/stores/table-data';
  import { getFirstEditableColumn } from '@mathesar/stores/table-data/processedColumns';
  import { SpinnerButton } from '@mathesar-component-library';

  const tabularData = getTabularDataStoreFromContext();
  const numberFormatter = new Intl.NumberFormat();

  export let context: 'page' | 'widget' = 'page';

  let width: number;

  $: ({
    recordsData,
    meta,
    isLoading,
    columnsDataStore,
    constraintsDataStore,
    canInsertRecords,
    processedColumns,
    selection,
  } = $tabularData);
  $: ({ pagination } = meta);
  $: ({ leftBound, rightBound } = $pagination);
  $: ({ totalCount, state, newRecords, persistedNewRecords } = recordsData);
  $: recordState = $state;
  $: columnsFetchStatus = columnsDataStore.fetchStatus;
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

  async function addRecord() {
    await recordsData.addEmptyRecord();

    // Select and focus the first editable cell in the new record row so that
    // the user can start editing immediately.
    selection.update((s) =>
      s.ofNewRecordDataEntryCell(
        getFirstEditableColumn($processedColumns.values())?.id.toString(),
      ),
    );
  }
</script>

<div
  class="status-pane"
  class:context-widget={context === 'widget'}
  class:context-page={context === 'page'}
  bind:clientWidth={width}
>
  <div class="status-pane-items-section">
    {#if hasNewRecordButton}
      <SpinnerButton
        disabled={$isLoading}
        size="medium"
        appearance="primary"
        onClick={addRecord}
        icon={iconAddNew}
        label={width > 520 ? $_('new_record') : undefined}
      />
    {/if}
    <div class="record-count">
      {#if $totalCount}
        <span>
          {#if width > 650}
            {$_('showing_n_to_m_of_total', {
              values: {
                leftBound: numberFormatter.format(leftBound),
                rightBound: numberFormatter.format(max),
                totalCount: numberFormatter.format($totalCount),
              },
            })}
          {:else}
            {$_('count_records', {
              values: { count: numberFormatter.format($totalCount) },
            })}
          {/if}
        </span>
      {:else if recordState !== States.Loading}
        {$_('no_records_found')}
      {/if}

      {#if width > 450}
        {#if $persistedNewRecords.length > 0}
          <span class="pill">
            +{$_('count_new_records', {
              values: {
                count: $persistedNewRecords.length,
              },
            })}
          </span>
        {/if}

        {#if $newRecords.length - $persistedNewRecords.length > 0}
          <span class="pill">
            +{$_('count_unsaved_records', {
              values: {
                count: $newRecords.length - $persistedNewRecords.length,
              },
            })}
          </span>
        {/if}
      {/if}
    </div>
  </div>

  <div class="status-pane-items-section">
    <MiniPagination
      bind:pagination={$pagination}
      recordCount={$totalCount ?? 0}
      pageSizeOptions={[10, 50, 100, 500]}
    />
    <RefreshButton
      on:click={refresh}
      state={refreshButtonState}
      showLabel={width > 550}
    />
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
      border: 1px solid var(--color-border-control);
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
