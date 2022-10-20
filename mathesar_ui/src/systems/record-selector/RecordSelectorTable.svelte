<script lang="ts">
  import { onMount } from 'svelte';
  import { router } from 'tinro';

  import type { Column } from '@mathesar/api/tables/columns';
  import type { Response as ApiRecordsResponse } from '@mathesar/api/tables/records';
  import {
    ImmutableSet,
    Spinner,
    Icon,
    Button,
  } from '@mathesar-component-library';
  import ProcessedColumnName from '@mathesar/components/column/ProcessedColumnName.svelte';
  import { storeToGetRecordPageUrl } from '@mathesar/stores/storeBasedUrls';
  import {
    setTabularDataStoreInContext,
    TabularData,
    constraintIsFk,
  } from '@mathesar/stores/table-data';
  import { postAPI, States } from '@mathesar/utils/api';
  import { tables } from '@mathesar/stores/tables';
  import {
    buildInputData,
    buildRecordSummariesForSheet,
    renderTransitiveRecordSummary,
  } from '@mathesar/stores/table-data/record-summaries/recordSummaryUtils';
  import { iconAddNew } from '@mathesar/icons';
  import CellArranger from './CellArranger.svelte';
  import CellWrapper from './RecordSelectorCellWrapper.svelte';
  import ColumnResizer from './ColumnResizer.svelte';
  import type {
    RecordSelectorController,
    RecordSelectorResult,
  } from './RecordSelectorController';
  import { setRecordSelectorControllerInContext } from './RecordSelectorController';
  import RecordSelectorInputCell from './RecordSelectorInputCell.svelte';
  import RecordSelectorResults from './RecordSelectorResults.svelte';
  import { getPkValueInRecord } from './recordSelectorUtils';

  export let controller: RecordSelectorController;
  export let tabularData: TabularData;
  export let nestedController: RecordSelectorController;

  const tabularDataStore = setTabularDataStoreInContext(tabularData);

  let columnWithFocus: Column | undefined = undefined;
  let isSubmittingNewRecord = false;
  let selectionIndex = 0;

  $: setRecordSelectorControllerInContext(nestedController);
  $: ({ columnWithNestedSelectorOpen, isOpen, purpose: rowType } = controller);
  $: tabularDataStore.set(tabularData);
  $: ({
    constraintsDataStore,
    display,
    meta,
    isLoading,
    columnsDataStore,
    id: tableId,
    recordsData,
  } = tabularData);
  $: ({ recordSummaries } = recordsData);
  $: ({ constraints, state: constraintsState } = $constraintsDataStore);
  $: nestedSelectorIsOpen = nestedController.isOpen;
  $: rowWidthStore = display.rowWidth;
  $: rowWidth = $rowWidthStore;
  $: ({ columns, state: columnsState } = $columnsDataStore);
  $: ({ searchFuzzy } = meta);
  $: hasSearchQueries = $searchFuzzy.size > 0;
  $: fkColumnIds = new ImmutableSet(
    constraints
      .filter(constraintIsFk)
      .filter((c) => c.columns.length === 1)
      .map((c) => c.columns[0]),
  );
  $: fkColumnWithFocus = (() => {
    if (columnWithFocus === undefined) {
      return undefined;
    }
    return fkColumnIds.has(columnWithFocus.id) ? columnWithFocus : undefined;
  })();
  $: isInitialized =
    columnsState === States.Done && constraintsState === States.Done;

  $: if ($isOpen) {
    meta.searchFuzzy.update((s) => s.drained());
  }

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

  function handleInputFocus(column: Column) {
    nestedController.cancel();
    columnWithFocus = column;
  }

  function handleInputBlur() {
    columnWithFocus = undefined;
  }

  onMount(() =>
    searchFuzzy.subscribe(() => {
      // Reset the selection index when the search query changes.
      selectionIndex = 0;
    }),
  );
</script>

<div
  class="record-selector-table"
  class:has-open-nested-selector={$nestedSelectorIsOpen}
>
  {#if $isLoading || isSubmittingNewRecord}
    <div
      class="loading-overlay"
      class:prevent-user-entry={isSubmittingNewRecord}
    >
      {#if isSubmittingNewRecord || !isInitialized}
        <Spinner size="2em" />
      {/if}
    </div>
  {/if}

  {#if isInitialized}
    <div class="row header" style="width: {rowWidth}px">
      <CellArranger {display} let:style let:processedColumn>
        <CellWrapper {style} cellType="columnHeader">
          <ProcessedColumnName {processedColumn} />
          <ColumnResizer columnId={processedColumn.column.id} />
        </CellWrapper>
      </CellArranger>
    </div>

    <div class="row inputs">
      <CellArranger {display} let:style let:processedColumn let:column>
        <RecordSelectorInputCell
          cellWrapperStyle={style}
          hasFocus={column === columnWithFocus}
          hasNestedSelectorOpen={column === $columnWithNestedSelectorOpen}
          {processedColumn}
          {searchFuzzy}
          recordSummaryStore={recordSummaries}
          on:focus={() => handleInputFocus(column)}
          on:blur={() => handleInputBlur()}
          on:recordSelectorOpen={() => {
            $columnWithNestedSelectorOpen = column;
          }}
          on:recordSelectorSubmit={() => {
            $columnWithNestedSelectorOpen = undefined;
          }}
          on:recordSelectorCancel={() => {
            $columnWithNestedSelectorOpen = undefined;
          }}
        />
      </CellArranger>
    </div>

    <div class="divider">
      <CellArranger {display} let:style>
        <CellWrapper {style} cellType="divider" />
      </CellArranger>
    </div>

    <RecordSelectorResults
      bind:selectionIndex
      {tableId}
      {fkColumnWithFocus}
      {hasSearchQueries}
      rowType={$rowType}
      {submitResult}
      on:linkClick={() => controller.cancel()}
    />
  {/if}
</div>

{#if hasSearchQueries}
  <div class="add-new">
    <Button size="small" appearance="secondary" on:click={submitNewRecord}>
      <Icon {...iconAddNew} />
      Create Record From Search Criteria
    </Button>
  </div>
{/if}

<style>
  .record-selector-table {
    position: relative;
    min-height: 6rem;
    display: flex;
    flex-direction: column;
    --divider-height: 0.7rem;
    --divider-color: #e7e7e7;
  }
  .loading-overlay {
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
  .loading-overlay.prevent-user-entry {
    pointer-events: all;
    background: rgba(255, 255, 255, 0.5);
  }
  .header,
  .inputs,
  .divider {
    flex: 0 0 auto;
  }
  .row {
    position: relative;
    height: 30px;
  }
  .divider {
    position: relative;
    height: var(--divider-height);
    box-sizing: content-box;
  }
  .add-new {
    margin-top: 1rem;
    text-align: right;
  }
</style>
