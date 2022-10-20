<script lang="ts">
  import { onMount } from 'svelte';

  // TODO: Remove route dependency in systems
  import RowCellBackgrounds from '@mathesar/systems/table-view/row/RowCellBackgrounds.svelte';

  import type { Column } from '@mathesar/api/tables/columns';

  import { ImmutableSet } from '@mathesar-component-library';
  import CellFabric from '@mathesar/components/cell-fabric/CellFabric.svelte';
  import ProcessedColumnName from '@mathesar/components/column/ProcessedColumnName.svelte';
  import { rowHeightPx } from '@mathesar/geometry';
  import { storeToGetRecordPageUrl } from '@mathesar/stores/storeBasedUrls';
  import {
    constraintIsFk,
    rowHasSavedRecord,
    setTabularDataStoreInContext,
    TabularData,
    type RecordRow,
  } from '@mathesar/stores/table-data';
  import {
    buildInputData,
    renderTransitiveRecordSummary,
  } from '@mathesar/stores/table-data/record-summaries/recordSummaryUtils';
  import { tables } from '@mathesar/stores/tables';
  import CellArranger from './CellArranger.svelte';
  import ColumnResizer from './ColumnResizer.svelte';
  import CellWrapper from './RecordSelectorCellWrapper.svelte';
  import type {
    RecordSelectorController,
    RecordSelectorResult,
  } from './RecordSelectorController';
  import { setRecordSelectorControllerInContext } from './RecordSelectorController';
  import RecordSelectorInputCell from './RecordSelectorInputCell.svelte';
  import RecordSelectorRow from './RecordSelectorRow.svelte';
  import { getPkValueInRecord } from './recordSelectorUtils';

  export let controller: RecordSelectorController;
  export let tabularData: TabularData;
  export let nestedController: RecordSelectorController;
  export let submitResult: (result: RecordSelectorResult) => void;

  const tabularDataStore = setTabularDataStoreInContext(tabularData);

  let columnWithFocus: Column | undefined = undefined;
  let selectionIndex = 0;

  $: setRecordSelectorControllerInContext(nestedController);
  $: ({ columnWithNestedSelectorOpen, isOpen, purpose: rowType } = controller);
  $: tabularDataStore.set(tabularData);
  $: ({
    constraintsDataStore,
    display,
    meta,
    columnsDataStore,
    id: tableId,
    recordsData,
  } = tabularData);
  $: ({ recordSummaries } = recordsData);
  $: ({ constraints } = $constraintsDataStore);
  $: nestedSelectorIsOpen = nestedController.isOpen;
  $: rowWidthStore = display.rowWidth;
  $: rowWidth = $rowWidthStore;
  $: ({ columns } = $columnsDataStore);
  $: ({ searchFuzzy } = meta);
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
  $: if ($isOpen) {
    meta.searchFuzzy.update((s) => s.drained());
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
    if ($nestedSelectorIsOpen) {
      return;
    }
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
    {/each}
  </div>
</div>

<style>
  .record-selector-table {
    position: relative;
    min-height: 6rem;
    display: flex;
    flex-direction: column;
    --divider-height: 0.7rem;
    --divider-color: #e7e7e7;
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
</style>
