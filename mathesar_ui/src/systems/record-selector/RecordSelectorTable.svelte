<script lang="ts">
  import { onMount, tick } from 'svelte';

  import { States } from '@mathesar/api/rest/utils/requestUtils';
  import type { RawColumnWithMetadata } from '@mathesar/api/rpc/columns';
  import { storeToGetRecordPageUrl } from '@mathesar/stores/storeBasedUrls';
  import {
    type RecordRow,
    type TabularData,
    constraintIsFk,
    extractPrimaryKeyValue,
    setTabularDataStoreInContext,
  } from '@mathesar/stores/table-data';
  import overflowObserver, {
    makeOverflowDetails,
  } from '@mathesar/utils/overflowObserver';
  import { ImmutableSet } from '@mathesar-component-library';

  import Cell from './RecordSelectorCellWrapper.svelte';
  import RecordSelectorColumnHeaderCell from './RecordSelectorColumnHeaderCell.svelte';
  import {
    type RecordSelectorController,
    type RecordSelectorResult,
    setRecordSelectorControllerInContext,
  } from './RecordSelectorController';
  import RecordSelectorDataCell from './RecordSelectorDataCell.svelte';
  import RecordSelectorDataRow from './RecordSelectorDataRow.svelte';
  import RecordSelectorSubmitButton from './RecordSelectorSubmitButton.svelte';

  export let controller: RecordSelectorController;
  export let tabularData: TabularData;
  export let nestedController: RecordSelectorController;
  export let submitResult: (result: RecordSelectorResult) => void;
  export let isHoveringCreate = false;
  export let handleKeyboardNavigation = false;

  const tabularDataStore = setTabularDataStoreInContext(tabularData);

  let columnWithFocus: RawColumnWithMetadata | undefined = undefined;
  /** It will be undefined if we're loading data, for example. */
  let selectionIndex: number | undefined = undefined;
  let tableElement: HTMLElement;

  $: setRecordSelectorControllerInContext(nestedController);
  $: ({ columnWithNestedSelectorOpen, purpose } = controller);
  $: tabularDataStore.set(tabularData);
  $: ({
    constraintsDataStore,
    meta,
    columnsDataStore,
    table,
    recordsData,
    processedColumns,
  } = tabularData);
  $: ({
    recordSummaries,
    linkedRecordSummaries,
    state: recordsDataState,
  } = recordsData);
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
  $: recordsStore = recordsData.fetchedRecordRows;
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

  function handleInputFocus(column: RawColumnWithMetadata) {
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
    return extractPrimaryKeyValue(record, $columns);
  }

  function getRowHref(row: RecordRow): string | undefined {
    if ($purpose === 'dataEntry') {
      return undefined;
    }
    const recordId = getPkValue(row);
    if (!recordId) {
      return undefined;
    }
    return $storeToGetRecordPageUrl({ tableId: table.oid, recordId });
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

    const recordSummary = $recordSummaries.get(String(recordId)) ?? '';

    submitResult({ recordId, recordSummary, record });
  }

  function submitSelection() {
    if (effectiveSelectionIndex === undefined) {
      return;
    }
    submitIndex(effectiveSelectionIndex);
  }

  function handleKeydown(e: KeyboardEvent) {
    if (!handleKeyboardNavigation) return;
    if ($nestedSelectorIsOpen) return;
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

  function findBestColumnIdToFocus(): number {
    const firstNonPkColumn = $columns.find((c) => c.primary_key === false);
    return firstNonPkColumn?.id ?? $columns[0].id;
  }

  async function focusBestInput() {
    const columnId = findBestColumnIdToFocus();
    await tick();
    const selector = `.record-selector-input.column-${columnId}`;
    const input = tableElement.querySelector<HTMLElement>(selector);
    if (input) {
      input.focus();
    }
  }

  onMount(() => {
    window.addEventListener('keydown', handleKeydown, { capture: true });
    return () => {
      window.removeEventListener('keydown', handleKeydown, { capture: true });
    };
  });

  onMount(focusBestInput);

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
  bind:this={tableElement}
>
  <div class="scroll-container" use:overflowObserver={overflowDetails}>
    <div class="table">
      <div class="thead">
        <div class="tr inputs">
          <Cell
            rowType="columnHeaderRow"
            columnType="rowHeaderColumn"
            {overflowDetails}
          />
          {#each [...$processedColumns] as [columnId, processedColumn] (columnId)}
            {@const { column } = processedColumn}
            <RecordSelectorColumnHeaderCell
              hasNestedSelectorOpen={column === $columnWithNestedSelectorOpen}
              {overflowDetails}
              {processedColumn}
              {searchFuzzy}
              recordSummaryStore={linkedRecordSummaries}
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
            <Cell
              rowType="dataRow"
              columnType="rowHeaderColumn"
              rowIsSelected={effectiveSelectionIndex === index}
              {overflowDetails}
            >
              <RecordSelectorSubmitButton
                purpose={$purpose}
                on:click={() => submitIndex(index)}
                isSelected={effectiveSelectionIndex === index}
              />
            </Cell>
            {#each [...$processedColumns] as [columnId, processedColumn] (columnId)}
              <RecordSelectorDataCell
                {row}
                {processedColumn}
                {linkedRecordSummaries}
                {searchFuzzy}
                isLoading={recordsDataIsLoading}
              />
            {/each}
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
    --overflow-shadow-color: var(--shadow-color);
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
    --border-width: 1px;
    --border-color: var(--border-color);
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
    width: 100%;
    pointer-events: none;
    z-index: var(--z-index__record_selector__shadow-inset);
  }
  .has-overflow-bottom .inset-shadow {
    box-shadow: 0 -1rem var(--overflow-shadow-size) -1rem
      var(--overflow-shadow-color) inset;
  }
  .has-overflow-right .inset-shadow {
    box-shadow: -1rem 0 var(--overflow-shadow-size) -1rem var(
        --overflow-shadow-color
      ) inset;
  }
  .has-overflow-right.has-overflow-bottom .inset-shadow {
    box-shadow: -1rem -1rem var(--overflow-shadow-size) -1rem
      var(--overflow-shadow-color) inset;
  }
</style>
