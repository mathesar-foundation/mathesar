<script lang="ts">
  import { onMount, tick } from 'svelte';

  import { ImmutableSet } from '@mathesar-component-library';
  import type { Column } from '@mathesar/api/types/tables/columns';
  import ProcessedColumnName from '@mathesar/components/column/ProcessedColumnName.svelte';
  import { storeToGetRecordPageUrl } from '@mathesar/stores/storeBasedUrls';
  import {
    constraintIsFk,
    setTabularDataStoreInContext,
    TabularData,
    type RecordRow,
  } from '@mathesar/stores/table-data';
  import {
    buildInputData,
    renderTransitiveRecordSummary,
  } from '@mathesar/stores/table-data/record-summaries/recordSummaryUtils';
  import { tables } from '@mathesar/stores/tables';
  import { States } from '@mathesar/api/utils/requestUtils';
  import overflowObserver, {
    makeOverflowDetails,
  } from '@mathesar/utils/overflowObserver';
  import { getPkValueInRecord } from '@mathesar/stores/table-data/records';
  import Cell from './RecordSelectorCellWrapper.svelte';
  import type {
    RecordSelectorController,
    RecordSelectorResult,
  } from './RecordSelectorController';
  import { setRecordSelectorControllerInContext } from './RecordSelectorController';
  import RecordSelectorDataRow from './RecordSelectorDataRow.svelte';
  import RecordSelectorInputCell from './RecordSelectorInputCell.svelte';
  import RecordSelectorSubmitButton from './RecordSelectorSubmitButton.svelte';
  import { getColumnIdToFocusInitially } from './recordSelectorUtils';
  import RecordSelectorDataCell from './RecordSelectorDataCell.svelte';

  export let controller: RecordSelectorController;
  export let tabularData: TabularData;
  export let nestedController: RecordSelectorController;
  export let submitResult: (result: RecordSelectorResult) => void;
  export let isHoveringCreate = false;

  const tabularDataStore = setTabularDataStoreInContext(tabularData);

  let columnWithFocus: Column | undefined = undefined;
  /** It will be undefined if we're loading data, for example. */
  let selectionIndex: number | undefined = undefined;

  $: setRecordSelectorControllerInContext(nestedController);
  $: ({ columnWithNestedSelectorOpen, purpose } = controller);
  $: tabularDataStore.set(tabularData);
  $: ({
    constraintsDataStore,
    meta,
    columnsDataStore,
    id: tableId,
    recordsData,
    processedColumns,
  } = tabularData);
  $: table = $tables.data.get(tableId);
  $: ({ recordSummaries, state: recordsDataState } = recordsData);
  $: recordsDataIsLoading = $recordsDataState === States.Loading;
  $: ({ constraints } = $constraintsDataStore);
  $: nestedSelectorIsOpen = nestedController.isOpen;
  $: ({ columns } = columnsDataStore);
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
  $: fkColumnWithFocus = (() => {
    if (columnWithFocus === undefined) {
      return undefined;
    }
    return fkColumnIds.has(columnWithFocus.id) ? columnWithFocus : undefined;
  })();

  function handleRecordsLoadingStateChange(isLoading: boolean) {
    if (isLoading) {
      selectionIndex = undefined;
    } else {
      selectionIndex = 0;
    }
  }
  $: handleRecordsLoadingStateChange(recordsDataIsLoading);

  $: effectiveSelectionIndex = isHoveringCreate ? undefined : selectionIndex;

  function handleInputFocus(column: Column) {
    nestedController.cancel();
    columnWithFocus = column;
  }

  function handleInputBlur() {
    columnWithFocus = undefined;
  }

  function moveSelectionByOffset(offset: number) {
    if (selectionIndex === undefined) {
      return;
    }
    const newSelectionIndex = selectionIndex + offset;
    selectionIndex = Math.min(Math.max(newSelectionIndex, 0), resultCount - 1);
  }

  function getPkValue(row: RecordRow): string | number | undefined {
    const { record } = row;
    if (!record || Object.keys(record).length === 0) {
      return undefined;
    }
    return getPkValueInRecord(record, $columns);
  }

  function getRowHref(row: RecordRow): string | undefined {
    if ($purpose === 'dataEntry') {
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
    if (effectiveSelectionIndex === undefined) {
      return;
    }
    submitIndex(effectiveSelectionIndex);
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

  onMount(() => {
    window.addEventListener('keydown', handleKeydown, { capture: true });
    return () => {
      window.removeEventListener('keydown', handleKeydown, { capture: true });
    };
  });

  onMount(async () => {
    const columnId = getColumnIdToFocusInitially({ table, columns: $columns });
    if (columnId === undefined) {
      return;
    }
    await tick();
    const selector = `.record-selector-input.column-${columnId}`;
    const input = document.querySelector<HTMLElement>(selector);
    if (input) {
      input.focus();
    }
  });

  const overflowDetails = makeOverflowDetails();
  const {
    hasOverflowTop,
    hasOverflowRight,
    hasOverflowBottom,
    hasOverflowLeft,
  } = overflowDetails;
</script>

<div
  class="inset-shadow-positioner"
  class:has-overflow-top={$hasOverflowTop}
  class:has-overflow-right={$hasOverflowRight}
  class:has-overflow-bottom={$hasOverflowBottom}
  class:has-overflow-left={$hasOverflowLeft}
>
  <div class="scroll-container" use:overflowObserver={overflowDetails}>
    <div class="table">
      <div class="thead">
        <div class="tr header">
          {#each [...$processedColumns] as [columnId, processedColumn] (columnId)}
            <Cell rowType="columnHeaderRow" columnType="dataColumn">
              <ProcessedColumnName {processedColumn} />
            </Cell>
          {/each}
          <Cell
            rowType="columnHeaderRow"
            columnType="rowHeaderColumn"
            {overflowDetails}
          />
        </div>
        <div class="tr inputs">
          {#each [...$processedColumns] as [columnId, processedColumn] (columnId)}
            {@const column = processedColumn.column}
            <RecordSelectorInputCell
              hasFocus={column === columnWithFocus}
              hasNestedSelectorOpen={column === $columnWithNestedSelectorOpen}
              {overflowDetails}
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
          {/each}
          <Cell
            rowType="searchInputRow"
            columnType="rowHeaderColumn"
            {overflowDetails}
          />
        </div>
        <div class="tr divider">
          {#each [...$processedColumns] as [columnId, _] (columnId)}
            <Cell
              rowType="dividerRow"
              columnType="dataColumn"
              {overflowDetails}
            />
          {/each}
          <Cell
            rowType="dividerRow"
            columnType="rowHeaderColumn"
            {overflowDetails}
          />
        </div>
      </div>
      <div class="tbody">
        {#each records as row, index}
          <!--
          We have duplicate click handlers on the row (for usability) and the
          submit button (for a11y). We can't use a button for the row element
          because the cell contains divs and divs don't go inside buttons.
        -->
          <RecordSelectorDataRow
            href={getRowHref(row)}
            on:click={() => submitIndex(index)}
            {index}
            selectionIndex={effectiveSelectionIndex}
            setSelectionIndex={(i) => {
              selectionIndex = i;
            }}
          >
            {#each [...$processedColumns] as [columnId, processedColumn] (columnId)}
              <RecordSelectorDataCell
                {row}
                {processedColumn}
                {recordSummaries}
                {searchFuzzy}
              />
            {/each}
            <Cell
              rowType="dataRow"
              columnType="rowHeaderColumn"
              {overflowDetails}
            >
              <RecordSelectorSubmitButton
                purpose={$purpose}
                on:click={() => submitIndex(index)}
                isSelected={effectiveSelectionIndex === index}
              />
            </Cell>
          </RecordSelectorDataRow>
        {/each}
      </div>
    </div>
  </div>
  <div class="inset-shadow" />
</div>

<style>
  .inset-shadow-positioner {
    flex: 0 1 auto;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    position: relative;
    --overflow-shadow-size: 0.75rem;
    --overflow-shadow-color: rgba(0, 0, 0, 0.4);
    --clip-path-size: calc(-1 * var(--overflow-shadow-size));
    --overflow-shadow: 0 0 var(--overflow-shadow-size)
      var(--overflow-shadow-color);
    --focus-highlight-width: 0.2rem;
  }
  .scroll-container {
    flex: 0 1 auto;
    min-height: 0;
    overflow: auto;
    position: relative;
  }
  .table {
    display: table;
    flex: 0 1 auto;
    overflow: auto;
    position: relative;
    border-spacing: 0;
    margin-left: var(--focus-highlight-width);
    --border-width: 1px;
    --border-color: #e7e7e7;
    --row-height: 2.25rem;
  }
  .thead {
    display: table-header-group;
  }
  .thead .tr:first-child {
    /**
     * This, along with the somewhat complex border CSS on `.cell-wrapper` is a
     * hacky way of getting collapsing borders.
     *
     * We can't use semantic table elements with `border-collapse: collapse;`
     * because those elements don't let us make the entire row into a hyperlink.
     *
     * We also can't set a border on `.table` because the border ends up
     * scrolling when we don't want it to scroll.
     */
    --border-top-width: var(--border-width);
  }
  .tbody {
    display: table-row-group;
  }
  .tr {
    display: table-row;
  }

  .inset-shadow {
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    width: calc(100% - var(--body-padding));
    pointer-events: none;
    z-index: var(--z-index__record_selector__shadow-inset);
  }
  .has-overflow-bottom .inset-shadow {
    box-shadow: 0 -1rem var(--overflow-shadow-size) -1rem
      var(--overflow-shadow-color) inset;
  }
  .has-overflow-left .inset-shadow {
    box-shadow: 1rem 0 var(--overflow-shadow-size) -1rem var(
        --overflow-shadow-color
      ) inset;
  }
  .has-overflow-left.has-overflow-bottom .inset-shadow {
    box-shadow: 1rem -1rem var(--overflow-shadow-size) -1rem
      var(--overflow-shadow-color) inset;
  }
</style>
