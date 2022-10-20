<script lang="ts">
  import { router } from 'tinro';

  import { Button, Icon, Spinner } from '@mathesar-component-library';
  import type { Response as ApiRecordsResponse } from '@mathesar/api/tables/records';
  import { iconAddNew } from '@mathesar/icons';
  import { storeToGetRecordPageUrl } from '@mathesar/stores/storeBasedUrls';
  import type { TabularData } from '@mathesar/stores/table-data';
  import {
    buildInputData,
    buildRecordSummariesForSheet,
    renderTransitiveRecordSummary,
  } from '@mathesar/stores/table-data/record-summaries/recordSummaryUtils';
  import { tables } from '@mathesar/stores/tables';
  import { postAPI, States } from '@mathesar/utils/api';
  import type {
    RecordSelectorController,
    RecordSelectorResult,
  } from './RecordSelectorController';
  import RecordSelectorTable from './RecordSelectorTable.svelte';
  import { getPkValueInRecord } from './recordSelectorUtils';

  export let controller: RecordSelectorController;
  export let tabularData: TabularData;
  export let nestedController: RecordSelectorController;

  let isSubmittingNewRecord = false;

  $: ({
    constraintsDataStore,
    meta,
    isLoading,
    columnsDataStore,
    recordsData,
    id: tableId,
  } = tabularData);
  $: ({ purpose: rowType } = controller);
  $: ({ columns, state: columnsState } = $columnsDataStore);
  $: ({ state: constraintsState } = $constraintsDataStore);
  $: isInitialized =
    columnsState === States.Done && constraintsState === States.Done;
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

  async function submitNewRecord() {
    const url = `/api/db/v0/tables/${tableId}/records/`;
    const body = Object.fromEntries($searchFuzzy);
    try {
      isSubmittingNewRecord = true;
      const response = await postAPI<ApiRecordsResponse>(url, body);
      const record = response.results[0];
      const recordId = getPkValueInRecord(record, columns);
      const previewData = response.preview_data ?? [];
      const tableEntry = $tables.data.get(tableId);
      const template = tableEntry?.settings?.preview_settings?.template;
      if (!template) {
        throw new Error('No record summary template found in API response.');
      }
      const recordSummary = renderTransitiveRecordSummary({
        inputData: buildInputData(record),
        template,
        transitiveData: buildRecordSummariesForSheet(previewData),
      });
      submitResult({ recordId, recordSummary });
    } catch (err) {
      // TODO set errors in tabularData to appear within cells
    } finally {
      isSubmittingNewRecord = false;
    }
  }
</script>

<div class="record-selector-content">
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
    />
  {/if}

  {#if !records.length}
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
        No {#if hasSearchQueries}matching{:else}existing{/if} records
      </div>
    {/if}
  {/if}

  {#if hasSearchQueries}
    <div class="add-new">
      <Button size="small" appearance="secondary" on:click={submitNewRecord}>
        <Icon {...iconAddNew} />
        Create Record From Search Criteria
      </Button>
    </div>
  {/if}
</div>

<style>
  .record-selector-content {
    position: relative;
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
    color: #aaa;
    z-index: var(--z-index-overlay);
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
    color: #aaa;
  }
  .no-results {
    padding: 1.5rem;
    text-align: center;
    color: var(--color-gray-dark);
  }

  .add-new {
    margin-top: 1rem;
    text-align: right;
  }
</style>
