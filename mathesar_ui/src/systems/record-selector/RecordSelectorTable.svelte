<script lang="ts">
  import { router } from 'tinro';

  import type { Column } from '@mathesar/api/tables/columns';
  import type { Response as ApiRecordsResponse } from '@mathesar/api/tables/records';
  import { ImmutableSet, Spinner } from '@mathesar-component-library';
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
  import Arrow from './Arrow.svelte';
  import CellArranger from './CellArranger.svelte';
  import CellWrapper from './CellWrapper.svelte';
  import ColumnResizer from './ColumnResizer.svelte';
  import NestedRecordSelector from './NestedRecordSelector.svelte';
  import QuarterCircle from './QuarterCircle.svelte';
  import type {
    RecordSelectorController,
    RecordSelectorResult,
  } from './RecordSelectorController';
  import { setNewRecordSelectorControllerInContext } from './RecordSelectorController';
  import RecordSelectorInput from './RecordSelectorInput.svelte';
  import RecordSelectorResults from './RecordSelectorResults.svelte';
  import { getPkValueInRecord } from './recordSelectorUtils';

  export let controller: RecordSelectorController;
  export let tabularData: TabularData;

  const nestedController = setNewRecordSelectorControllerInContext();
  const tabularDataStore = setTabularDataStoreInContext(tabularData);

  let columnWithFocus: Column | undefined = undefined;
  let isSubmittingNewRecord = false;

  $: ({ columnWithNestedSelectorOpen, isOpen, rowType } = controller);
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
  $: ({ recordSummariesForSheet } = recordsData);
  $: ({ constraints, state: constraintsState } = $constraintsDataStore);
  $: nestedSelectorIsOpen = nestedController.isOpen;
  $: rowWidthStore = display.rowWidth;
  $: rowWidth = $rowWidthStore;
  $: ({ columns, state: columnsState } = $columnsDataStore);
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
    if ($rowType === 'button') {
      controller.submit(result);
    } else if ($rowType === 'hyperlink') {
      const { recordId } = result;
      const recordPageUrl = $storeToGetRecordPageUrl({ tableId, recordId });
      if (recordPageUrl) {
        router.goto(recordPageUrl);
        controller.cancel();
      }
    }
  }

  async function handleSubmitNewRecord(v: Iterable<[number, unknown]>) {
    const url = `/api/db/v0/tables/${tableId}/records/`;
    const body = Object.fromEntries(v);
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
</script>

<div
  class="record-selector-table"
  class:has-open-nested-selector={$nestedSelectorIsOpen}
>
  {#if $isLoading || isSubmittingNewRecord}
    <div
      class="loading-spinner"
      class:prevent-user-entry={isSubmittingNewRecord}
    >
      <Spinner size="2em" />
    </div>
  {/if}

  {#if isInitialized}
    <div class="row header" style="width: {rowWidth}px">
      <CellArranger {display} let:style let:processedColumn>
        <CellWrapper header {style}>
          <ProcessedColumnName {processedColumn} />
          <ColumnResizer columnId={processedColumn.column.id} />
        </CellWrapper>
      </CellArranger>
      <div class="overlay" />
    </div>

    <div class="row inputs">
      <CellArranger {display} let:style let:processedColumn let:column>
        {@const columnId = processedColumn.id}
        {#if column === $columnWithNestedSelectorOpen}
          <div class="active-fk-cell-indicator" {style}>
            <div class="border" />
            <div class="knockout">
              <div class="smoother left"><QuarterCircle /></div>
              <div class="smoother right"><QuarterCircle /></div>
            </div>
            <div class="arrow"><Arrow /></div>
          </div>
        {:else if column === columnWithFocus}
          <div class="highlight" {style} />
        {/if}
        <CellWrapper
          style="{style}{column === columnWithFocus ? 'z-index: 101;' : ''}"
        >
          <RecordSelectorInput
            class="record-selector-input column-{columnId}"
            containerClass="record-selector-input-container"
            componentAndProps={processedColumn.inputComponentAndProps}
            searchFuzzy={meta.searchFuzzy}
            {columnId}
            getRecordSummary={(recordId) =>
              $recordSummariesForSheet.get(String(columnId))?.get(recordId)}
            setRecordSummary={(recordId, recordSummary) =>
              recordsData.setBespokeRecordSummary({
                columnId,
                recordId,
                recordSummary,
              })}
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
        </CellWrapper>
      </CellArranger>
      <div class="overlay" />
    </div>

    <div class="divider">
      <CellArranger {display} let:style>
        <CellWrapper {style} divider />
      </CellArranger>
    </div>

    {#if $nestedSelectorIsOpen}
      <NestedRecordSelector />
    {:else}
      <RecordSelectorResults
        {tableId}
        {fkColumnWithFocus}
        rowType={$rowType}
        {submitResult}
        submitNewRecord={handleSubmitNewRecord}
        on:linkClick={() => controller.cancel()}
      />
    {/if}
  {/if}
</div>

<style>
  .record-selector-table {
    position: relative;
    min-height: 6rem;
    --divider-height: 0.7rem;
    --divider-color: #e7e7e7;
    --color-highlight: #428af4;
  }
  .loading-spinner {
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    color: #aaa;
    z-index: 100;
    pointer-events: none;
  }
  .loading-spinner.prevent-user-entry {
    pointer-events: all;
    background: rgba(255, 255, 255, 0.5);
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
  .inputs :global(.record-selector-input-container) {
    height: 100%;
    width: 100%;
  }
  .inputs :global(.record-selector-input) {
    height: 100%;
    width: 100%;
    border: none;
  }
  .inputs :global(.record-selector-input:focus) {
    outline: none;
    border: none;
    box-shadow: none;
  }
  .highlight {
    position: absolute;
    height: 100%;
    z-index: 100;
    border-radius: 2px;
    box-shadow: 0 0 0 2px var(--color-highlight);
    pointer-events: none;
  }
  .active-fk-cell-indicator {
    --border-width: 3px;
    position: absolute;
    height: 100%;
    z-index: 102;
    pointer-events: none;
  }
  .active-fk-cell-indicator .border {
    position: absolute;
    height: 100%;
    width: 100%;
    top: calc(-1 * var(--border-width));
    left: calc(-1 * var(--border-width));
    box-sizing: content-box;
    border: dashed var(--border-width) var(--color-highlight);
    z-index: 2;
  }
  .active-fk-cell-indicator .knockout {
    position: absolute;
    height: var(--divider-height);
    width: calc(100% + 2 * (var(--divider-height) + var(--border-width)));
    bottom: calc(-1 * var(--divider-height));
    left: calc(-1 * var(--border-width) + -1 * var(--divider-height));
    background: white;
    z-index: 1;
  }
  .active-fk-cell-indicator .smoother {
    position: absolute;
    color: var(--divider-color);
    height: var(--divider-height);
    width: var(--divider-height);
  }
  .active-fk-cell-indicator .smoother.right {
    right: 0;
    /* 1px forces some overlap to prevent sub-pixel gaps */
    transform: translate(1px) scaleX(-1);
  }
  .active-fk-cell-indicator :global(svg) {
    display: block;
    height: 100%;
    width: 100%;
  }
  .active-fk-cell-indicator .arrow {
    color: var(--color-highlight);
    position: absolute;
    --size: 1.2rem;
    width: var(--size);
    bottom: -1.5rem;
    left: calc(50% - var(--size) / 2);
    z-index: 3;
    transform: scaleY(-1);
  }
  .overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(255, 255, 255, 0.5);
    z-index: 100;
    pointer-events: none;
  }
  .record-selector-table:not(.has-open-nested-selector) .overlay {
    display: none;
  }
</style>
