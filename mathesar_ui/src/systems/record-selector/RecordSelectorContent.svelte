<script lang="ts">
  import { router } from 'tinro';

  import { Button, Icon, Spinner } from '@mathesar-component-library';
  import type { Response as ApiRecordsResponse } from '@mathesar/api/types/tables/records';
  import { iconAddNew } from '@mathesar/icons';
  import { storeToGetRecordPageUrl } from '@mathesar/stores/storeBasedUrls';
  import type { TabularData } from '@mathesar/stores/table-data';
  import {
    buildInputData,
    buildRecordSummariesForSheet,
    renderTransitiveRecordSummary,
  } from '@mathesar/stores/table-data/record-summaries/recordSummaryUtils';
  import { tables } from '@mathesar/stores/tables';
  import { toast } from '@mathesar/stores/toast';
  import { postAPI, States } from '@mathesar/api/utils/requestUtils';
  import { getErrorMessage } from '@mathesar/utils/errors';
  import { getPkValueInRecord } from '@mathesar/stores/table-data/records';
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

  async function submitNewRecord() {
    const url = `/api/db/v0/tables/${tableId}/records/`;
    const body = Object.fromEntries($searchFuzzy);
    try {
      isSubmittingNewRecord = true;
      const response = await postAPI<ApiRecordsResponse>(url, body);
      const record = response.results[0];
      const recordId = getPkValueInRecord(record, $columns);
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
        No {#if hasSearchQueries}matching{:else}existing{/if} records
      </div>
    {/if}
  {/if}

  {#if hasSearchQueries}
    <div class="footer">
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
        <span>Create Record From Search Criteria</span>
      </Button>
    </div>
  {/if}
</div>

<style>
  .record-selector-content {
    position: relative;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    --body-padding: 1rem;
    /** This is to give extra horizontal space between the right-most edge of
     * the lower inset shadow and the right-most edge of the submit buttons when
     * the content is scrolling vertically. Without it, the edge of the shadow
     * is aligned directly with the edge of the button, and it doesn't look
     * good. We're using a CSS variable here so that we can keep the right edges
     * of the submit buttons aligned with the right edge of the "create new"
     * button. */
    --extra-body-padding: 0.5rem;
    padding: var(--body-padding);
    /** So that the table's vertical scroll bar is flush against window */
    padding-right: 0;
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
    text-align: right;
    margin-top: 0.5rem;
    padding-right: calc(var(--body-padding) + var(--extra-body-padding));
  }
</style>
