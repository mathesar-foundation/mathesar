<script lang="ts">
  import { _ } from 'svelte-i18n';
  import { router } from 'tinro';

  import { States } from '@mathesar/api/rest/utils/requestUtils';
  import { api } from '@mathesar/api/rpc';
  import WarningBox from '@mathesar/components/message-boxes/WarningBox.svelte';
  import { MiniPagination } from '@mathesar/components/mini-pagination';
  import { iconAddNew } from '@mathesar/icons';
  import { storeToGetRecordPageUrl } from '@mathesar/stores/storeBasedUrls';
  import {
    type TabularData,
    extractPrimaryKeyValue,
  } from '@mathesar/stores/table-data';
  import { toast } from '@mathesar/stores/toast';
  import { getErrorMessage } from '@mathesar/utils/errors';
  import { Button, Icon, Spinner } from '@mathesar-component-library';

  import type {
    RecordSelectorController,
    RecordSelectorResult,
  } from './RecordSelectorController';
  import RecordSelectorTable from './RecordSelectorTable.svelte';

  const numberFormatter = new Intl.NumberFormat();

  export let controller: RecordSelectorController;
  export let tabularData: TabularData;
  export let nestedController: RecordSelectorController;
  export let height = 0;

  let isSubmittingNewRecord = false;
  /** true when the user is hover on the "Create new record" button. */
  let isHoveringCreate = false;
  let pageJumperIsOpen = false;
  let footerHeight: number;

  $: ({
    database,
    constraintsDataStore,
    meta,
    isLoading,
    columnsDataStore,
    recordsData,
    table,
    hasPrimaryKey,
  } = tabularData);
  $: ({ currentRolePrivileges } = table.currentAccess);
  $: hasSelect = $currentRolePrivileges.has('SELECT');
  $: canViewTable = $hasPrimaryKey && hasSelect;
  $: canInsertRecords = $currentRolePrivileges.has('INSERT');
  $: ({ purpose: rowType } = controller);
  $: ({ columns, fetchStatus } = columnsDataStore);
  $: ({ state: constraintsState } = $constraintsDataStore);
  $: isInitialized =
    $fetchStatus?.state !== 'processing' && constraintsState === States.Done;
  $: ({ searchFuzzy, pagination } = meta);
  $: hasSearchQueries = $searchFuzzy.size > 0;
  $: recordsStore = recordsData.fetchedRecordRows;
  $: recordCount = recordsData.totalCount;
  $: records = $recordsStore;
  $: hasAddRecordButton = hasSearchQueries && canInsertRecords;
  $: hasPagination = isInitialized && ($recordCount ?? 0) > $pagination.size;
  $: showingMin = $pagination.leftBound;
  $: showingMax = Math.min($pagination.rightBound, $recordCount ?? 0);
  /**
   * We use this to apply custom CSS for the case when there is no flex
   * wrapping in the footer.
   */
  $: footerIsTall = footerHeight > 45;

  function submitResult(result: RecordSelectorResult) {
    if ($rowType === 'dataEntry') {
      controller.submit(result);
    } else if ($rowType === 'navigation') {
      const { recordId } = result;
      const recordPageUrl = $storeToGetRecordPageUrl({
        tableId: table.oid,
        recordId,
      });
      if (recordPageUrl) {
        router.goto(recordPageUrl);
        controller.cancel();
      }
    }
  }

  function getDataForNewRecord(): Record<string, unknown> {
    const pkColumnIds = $columns.filter((c) => c.primary_key).map((c) => c.id);
    return Object.fromEntries($searchFuzzy.without(pkColumnIds));
  }

  async function submitNewRecord() {
    try {
      isSubmittingNewRecord = true;
      const response = await api.records
        .add({
          database_id: database.id,
          table_oid: table.oid,
          record_def: getDataForNewRecord(),
          return_record_summaries: true,
        })
        .run();
      const record = response.results[0];
      const recordId = extractPrimaryKeyValue(record, $columns);

      const recordSummary = response.record_summaries?.[recordId] ?? '';

      submitResult({ recordId, recordSummary, record });
    } catch (err) {
      toast.error(getErrorMessage(err));
      // TODO set errors in tabularData to appear within cells
    } finally {
      isSubmittingNewRecord = false;
    }
  }
</script>

<div
  class="record-selector-content"
  bind:clientHeight={height}
  class:loading={$isLoading}
>
  {#if $isLoading || isSubmittingNewRecord}
    <div
      class="content-loading"
      class:prevent-user-entry={isSubmittingNewRecord}
    >
      {#if isSubmittingNewRecord || !isInitialized}
        <Spinner size="2em" />
      {/if}
    </div>
  {/if}

  {#if isInitialized && canViewTable}
    <RecordSelectorTable
      {tabularData}
      {controller}
      {nestedController}
      {submitResult}
      {isHoveringCreate}
      handleKeyboardNavigation={!pageJumperIsOpen}
    />
  {/if}

  {#if isInitialized && !canViewTable}
    <WarningBox fullWidth>
      {#if !$hasPrimaryKey}
        {$_('record_sel_no_support_for_table_without_pk')}
      {:else if !hasSelect}
        {$_('no_privileges_view_table')}
      {/if}
    </WarningBox>
  {/if}

  {#if isInitialized && !records.length && canViewTable}
    {#if $isLoading}
      <!--
        This only shows when there are no results. When there are results, the
        loading state is indicated by skeletons within each cell
      -->
      <div class="results-loading">
        <Spinner size="2em" />
      </div>
    {:else}
      <div class="no-results">
        {#if hasSearchQueries}
          {$_('no_matching_records')}
        {:else}
          {$_('no_existing_records')}
        {/if}
      </div>
    {/if}
  {/if}

  <div
    class="footer"
    bind:clientHeight={footerHeight}
    class:wrapping={footerIsTall}
    class:has-add-button={hasAddRecordButton}
    class:has-pagination={hasPagination}
  >
    {#if $recordCount}
      <div class="stats">
        {#if hasPagination}
          {$_('showing_n_to_m_of_total', {
            values: {
              leftBound: numberFormatter.format(showingMin),
              rightBound: numberFormatter.format(showingMax),
              totalCount: numberFormatter.format($recordCount),
            },
          })}
        {:else}
          {$_('count_records', { values: { count: $recordCount } })}
        {/if}
      </div>
    {/if}
    {#if hasAddRecordButton}
      <div class="add-button">
        <Button
          size="small"
          appearance="secondary"
          on:click={submitNewRecord}
          on:mouseenter={() => {
            isHoveringCreate = true;
          }}
          on:mouseleave={() => {
            isHoveringCreate = false;
          }}
        >
          <Icon {...iconAddNew} />
          <span>{$_('create_record_from_search')}</span>
        </Button>
      </div>
    {/if}
    {#if hasPagination}
      <div class="pager">
        <div class="positioner">
          <MiniPagination
            bind:pagination={$pagination}
            recordCount={$recordCount ?? 0}
            bind:pageJumperIsOpen
          />
        </div>
      </div>
    {/if}
  </div>
</div>

<style lang="scss">
  .record-selector-content {
    position: relative;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    min-height: 4rem;
  }

  .content-loading {
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    color: var(--gray-400);
    z-index: var(--z-index__record_selector__overlay);
    pointer-events: none;
  }
  .content-loading.prevent-user-entry {
    pointer-events: all;
    background: rgba(255, 255, 255, 0.5);
  }
  .results-loading {
    padding: 1rem;
    display: flex;
    justify-content: center;
    align-items: center;
    color: var(--gray-400);
  }
  .no-results {
    padding: 1.5rem;
    text-align: center;
    color: var(--color-gray-dark);
  }

  .loading .stats {
    visibility: hidden;
  }

  .footer {
    margin-top: var(--sm1);
    display: flex;
    // We're using 'reverse' so that when things wrap, we end up with one thing
    // on top instead of one thing on bottom.
    flex-direction: row-reverse;
    flex-wrap: wrap-reverse;
    align-items: center;
    justify-content: space-between;
    gap: var(--sm4);

    & > * {
      flex: 1 1 auto;
    }

    .stats {
      order: 3;
      text-align: center;
      font-size: var(--sm1);
      color: var(--text-color-muted);
    }
    .add-button {
      order: 2;
    }
    .pager {
      order: 1;
      & > .positioner {
        max-width: min-content;
        margin-left: auto;
      }
    }

    // WITH PAGINATION
    &.has-pagination {
      .stats {
        text-align: left;
      }
      &:not(.wrapping) .add-button {
        order: 4;
      }
    }

    // WITH ADD RECORD BUTTON
    &.has-add-button {
      &:not(.wrapping) {
        .stats {
          text-align: right;
        }
        .add-button {
          order: 4;
        }
      }
    }

    // WITH PAGINATION AND ADD RECORD BUTTON
    &.has-pagination.has-add-button {
      .add-button {
        order: 4;
      }
      &:not(.wrapping) {
        .stats {
          text-align: center;
        }
      }
    }
  }
</style>
