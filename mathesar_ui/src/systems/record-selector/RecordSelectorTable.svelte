<script lang="ts">
  import { onMount } from 'svelte';
  import { router } from 'tinro';

  // TODO: Remove route dependency in systems
  import RowCellBackgrounds from '@mathesar/systems/table-view/row/RowCellBackgrounds.svelte';

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
  import CellFabric from '@mathesar/components/cell-fabric/CellFabric.svelte';
  import {
    rowHasSavedRecord,
    type RecordRow,
  } from '@mathesar/stores/table-data';
  import { rowHeightPx } from '@mathesar/geometry';
  import CellArranger from './CellArranger.svelte';
  import CellWrapper from './RecordSelectorCellWrapper.svelte';
  import ColumnResizer from './ColumnResizer.svelte';
  import type {
    RecordSelectorController,
    RecordSelectorResult,
  } from './RecordSelectorController';
  import { setRecordSelectorControllerInContext } from './RecordSelectorController';
  import RecordSelectorInputCell from './RecordSelectorInputCell.svelte';
  import { getPkValueInRecord } from './recordSelectorUtils';
  import RecordSelectorRow from './RecordSelectorRow.svelte';

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
  $: recordsStore = recordsData.savedRecords;
  $: records = $recordsStore;
  $: resultCount = records.length;
  $: rowStyle = `width: ${rowWidth as number}px; height: ${rowHeightPx}px;`;
  $: indexIsSelected = (index: number) => selectionIndex === index;
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

  function moveSelectionByOffset(offset: number) {
    const newSelectionIndex = selectionIndex + offset;
    selectionIndex = Math.min(Math.max(newSelectionIndex, 0), resultCount - 1);
  }

  function getPkValue(row: RecordRow): string | number | undefined {
    const { record } = row;
    if (!record || Object.keys(record).length === 0) {
      return undefined;
    }
    return getPkValueInRecord(record, columns);
  }

  function getRowHref(row: RecordRow): string | undefined {
    if ($rowType === 'dataEntry') {
      return undefined;
    }
    const recordId = getPkValue(row);
    if (!recordId) {
      return undefined;
    }
    return $storeToGetRecordPageUrl({ tableId, recordId });
  }

  function submitIndex(index: number) {
    const row = records[index] as RecordRow | undefined;
    if (!row) {
      // e.g. if there are no results and the user pressed Enter to submit
      return;
    }
    const { record } = row;
    const recordId = getPkValue(row);
    if (!record || recordId === undefined) {
      return;
    }
    const tableEntry = $tables.data.get(tableId);
    const template = tableEntry?.settings?.preview_settings?.template ?? '';
    const recordSummary = renderTransitiveRecordSummary({
      template,
      inputData: buildInputData(record),
      transitiveData: $recordSummaries,
    });
    submitResult({ recordId, recordSummary });
  }

  function submitSelection() {
    submitIndex(selectionIndex);
  }

  function handleKeydown(e: KeyboardEvent) {
    let handled = true;
    switch (e.key) {
      case 'ArrowUp':
        moveSelectionByOffset(-1);
        break;
      case 'ArrowDown':
        moveSelectionByOffset(1);
        break;
      case 'Enter':
        // When we have a FK search cell selected, we use `Enter` to open the
        // nested selector. That event is handled by LinkedRecordInput, so we
        // don't need to handle it here -- we just need to make sure to _not_
        // handle other events here in that case. We still let the user submit
        // the selected record by using Shift+Enter.
        if (!fkColumnWithFocus || e.shiftKey) {
          submitSelection();
        } else {
          handled = false;
        }
        break;
      default:
        handled = false;
    }

    if (handled) {
      e.stopPropagation();
      e.preventDefault();
    }
  }

  onMount(() =>
    searchFuzzy.subscribe(() => {
      // Reset the selection index when the search query changes.
      selectionIndex = 0;
    }),
  );

  onMount(() => {
    window.addEventListener('keydown', handleKeydown, { capture: true });
    return () => {
      window.removeEventListener('keydown', handleKeydown, { capture: true });
    };
  });
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

    <div class="record-selector-results">
      {#each records as row, index}
        <div class="row" style={rowStyle}>
          <RecordSelectorRow
            href={getRowHref(row)}
            on:linkClick
            on:buttonClick={() => submitIndex(index)}
          >
            <CellArranger {display} let:style let:processedColumn>
              {@const columnId = processedColumn.id}
              {@const value = row?.record?.[columnId]}
              <CellWrapper {style} cellType="data">
                <CellFabric
                  columnFabric={processedColumn}
                  {value}
                  recordSummary={$recordSummaries
                    .get(String(columnId))
                    ?.get(String(value))}
                  disabled
                  showAsSkeleton={!rowHasSavedRecord(row)}
                />
                <RowCellBackgrounds isSelected={indexIsSelected(index)} />
              </CellWrapper>
            </CellArranger>
          </RecordSelectorRow>
        </div>
      {:else}
        {#if $isLoading}
          <div class="loading-indicator">
            <Spinner size="2em" />
          </div>
        {:else}
          <div class="no-results">
            No {#if hasSearchQueries}matching{:else}existing{/if} records
          </div>
        {/if}
      {/each}
    </div>
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

  .record-selector-results {
    overflow-y: auto;
  }
  .row {
    position: relative;
    cursor: pointer;
  }
  .row:not(:hover) :global(.cell-bg-row-hover) {
    display: none;
  }
  .loading-indicator {
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
