<script lang="ts">
  import { _ } from 'svelte-i18n';
  import { router } from 'tinro';

  import type { Response as ApiRecordsResponse } from '@mathesar/api/rest/types/tables/records';
  import { States, postAPI } from '@mathesar/api/rest/utils/requestUtils';
  import { iconAddNew } from '@mathesar/icons';
  import { storeToGetRecordPageUrl } from '@mathesar/stores/storeBasedUrls';
  import type { TabularData } from '@mathesar/stores/table-data';
  import {
    buildInputData,
    buildRecordSummariesForSheet,
    renderTransitiveRecordSummary,
  } from '@mathesar/stores/table-data/record-summaries/recordSummaryUtils';
  import { getPkValueInRecord } from '@mathesar/stores/table-data/records';
  import { currentTablesData } from '@mathesar/stores/tables';
  import { toast } from '@mathesar/stores/toast';
  import { getErrorMessage } from '@mathesar/utils/errors';
  import { Button, Icon, Spinner } from '@mathesar-component-library';

  import type {
    RecordSelectorController,
    RecordSelectorResult,
  } from './RecordSelectorController';
  import RecordSelectorTable from './RecordSelectorTable.svelte';

  export let controller: RecordSelectorController;
  export let tabularData: TabularData;
  export let nestedController: RecordSelectorController;
  export let height = 0;

  let isSubmittingNewRecord = false;
  /** true when the user is hover on the "Create new record" button. */
  let isHoveringCreate = false;

  $: ({
    constraintsDataStore,
    meta,
    isLoading,
    columnsDataStore,
    recordsData,
    id: tableId,
  } = tabularData);
  $: ({ purpose: rowType } = controller);
  $: ({ columns, fetchStatus } = columnsDataStore);
  $: ({ state: constraintsState } = $constraintsDataStore);
  $: isInitialized =
    $fetchStatus?.state !== 'processing' && constraintsState === States.Done;
  $: ({ searchFuzzy } = meta);
  $: hasSearchQueries = $searchFuzzy.size > 0;
  $: recordsStore = recordsData.savedRecords;
  $: records = $recordsStore;

  function submitResult(result: RecordSelectorResult) {
    if ($rowType === 'dataEntry') {
      controller.submit(result);
    } else if ($rowType === 'navigation') {
      const { recordId } = result;
      const recordPageUrl = $storeToGetRecordPageUrl({ tableId, recordId });
      if (recordPageUrl) {
        router.goto(recordPageUrl);
        controller.cancel();
      }
    }
  }

  function getDataForNewRecord(): Record<number, unknown> {
    const pkColumnIds = $columns.filter((c) => c.primary_key).map((c) => c.id);
    return Object.fromEntries($searchFuzzy.without(pkColumnIds));
  }

  async function submitNewRecord() {
    const url = `/api/db/v0/tables/${tableId}/records/`;
    const body = getDataForNewRecord();
    try {
      isSubmittingNewRecord = true;
      const response = await postAPI<ApiRecordsResponse>(url, body);
      const record = response.results[0];
      const recordId = getPkValueInRecord(record, $columns);
      const previewData = response.preview_data ?? [];
      const table = $currentTablesData.tablesMap.get(tableId);
      const template = table?.metadata?.record_summary_template;
      // TODO_RS_TEMPLATE
      //
      // We need to change the logic here to account for the fact that sometimes
      // the record summary template actually _will_ be missing. We need to
      // handle this on the client.
      if (!template) {
        throw new Error('TODO_RS_TEMPLATE');
      }
      const recordSummary = renderTransitiveRecordSummary({
        inputData: buildInputData(record),
        template,
        transitiveData: buildRecordSummariesForSheet(previewData),
      });
      submitResult({ recordId, recordSummary, record });
    } catch (err) {
      toast.error(getErrorMessage(err));
      // TODO set errors in tabularData to appear within cells
    } finally {
      isSubmittingNewRecord = false;
    }
  }
</script>

<div class="record-selector-content" bind:clientHeight={height}>
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

  {#if isInitialized}
    <RecordSelectorTable
      {tabularData}
      {controller}
      {nestedController}
      {submitResult}
      {isHoveringCreate}
    />
  {/if}

  {#if isInitialized && !records.length}
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

  <div class="footer">
    {#if hasSearchQueries}
      <div class="button">
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
    {#if records.length === 10 && isInitialized}
      <div class="message">
        {#if hasSearchQueries}
          {$_('ten_best_matches_shown')}
        {:else}
          {$_('first_ten_records_shown')}
        {/if}
      </div>
    {/if}
  </div>
</div>

<style>
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
    color: var(--slate-200);
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
    color: var(--slate-200);
  }
  .no-results {
    padding: 1.5rem;
    text-align: center;
    color: var(--color-gray-dark);
  }

  .footer {
    --spacing: 0.5rem;
    margin: calc(-1 * var(--spacing));
    margin-top: var(--spacing);
    display: flex;
    flex-wrap: wrap;
    align-items: center;
  }
  .footer > :global(*) {
    margin: var(--spacing);
  }
  .footer .button {
    flex: 0 0 auto;
  }
  .footer .message {
    flex: 1 0 10rem;
    margin-left: 1rem;
    font-size: var(--text-size-small);
    color: var(--color-text-muted);
    text-align: right;
  }
</style>
