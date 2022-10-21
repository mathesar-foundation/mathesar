<script lang="ts">
  import { onMount } from 'svelte';

  import { Button, Icon, ImmutableSet } from '@mathesar-component-library';
  import type { Column } from '@mathesar/api/tables/columns';
  import CellFabric from '@mathesar/components/cell-fabric/CellFabric.svelte';
  import ProcessedColumnName from '@mathesar/components/column/ProcessedColumnName.svelte';
  import { rowHeightPx } from '@mathesar/geometry';
  import { iconLinkToRecordPage, iconPickRecord } from '@mathesar/icons';
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
  import overflowObserver, {
    makeOverflowDetails,
  } from '@mathesar/utils/overflowObserver';
  import Cell from './RecordSelectorCellWrapper.svelte';
  import type {
    RecordSelectorController,
    RecordSelectorResult,
  } from './RecordSelectorController';
  import { setRecordSelectorControllerInContext } from './RecordSelectorController';
  import RecordSelectorInputCell from './RecordSelectorInputCell.svelte';
  import { getPkValueInRecord } from './recordSelectorUtils';

  export let controller: RecordSelectorController;
  export let tabularData: TabularData;
  export let nestedController: RecordSelectorController;
  export let submitResult: (result: RecordSelectorResult) => void;

  const tabularDataStore = setTabularDataStoreInContext(tabularData);

  let columnWithFocus: Column | undefined = undefined;
  let selectionIndex = 0;

  $: setRecordSelectorControllerInContext(nestedController);
  $: ({ columnWithNestedSelectorOpen, isOpen, purpose } = controller);
  $: tabularDataStore.set(tabularData);
  $: ({
    constraintsDataStore,
    display,
    meta,
    columnsDataStore,
    id: tableId,
    recordsData,
    processedColumns,
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
  $: icon = $purpose === 'dataEntry' ? iconPickRecord : iconLinkToRecordPage;
  $: buttonPhrase = $purpose === 'dataEntry' ? 'Pick' : 'Open';
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

  const overflowDetails = makeOverflowDetails();
  const {
    hasOverflowTop,
    hasOverflowRight,
    hasOverflowBottom,
    hasOverflowLeft,
  } = overflowDetails;
</script>

<div
  class="scroll-container"
  class:has-overflow-top={$hasOverflowTop}
  class:has-overflow-bottom={$hasOverflowBottom}
  use:overflowObserver={overflowDetails}
>
  <table class="record-selector-table">
    <thead>
      <tr class="header">
        {#each [...$processedColumns] as [columnId, processedColumn] (columnId)}
          <Cell cellType="columnHeader">
            <ProcessedColumnName {processedColumn} />
          </Cell>
        {/each}
        <Cell cellType="columnHeader" />
      </tr>
      <tr class="inputs">
        {#each [...$processedColumns] as [columnId, processedColumn] (columnId)}
          {@const column = processedColumn.column}
          <RecordSelectorInputCell
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
        {/each}
        <Cell cellType="searchInput" />
      </tr>
    </thead>
    <tbody>
      {#each records as row}
        <tr class="row" style={rowStyle}>
          {#each [...$processedColumns] as [columnId, processedColumn] (columnId)}
            {@const value = row?.record?.[columnId]}
            <Cell cellType="data">
              <CellFabric
                columnFabric={processedColumn}
                {value}
                recordSummary={$recordSummaries
                  .get(String(columnId))
                  ?.get(String(value))}
                disabled
                showAsSkeleton={!rowHasSavedRecord(row)}
              />
            </Cell>
          {/each}
          <Cell cellType="rowHeader">
            <Button size="small" appearance="primary">
              <Icon {...icon} />
              {buttonPhrase}
            </Button>
          </Cell>
        </tr>
      {/each}
    </tbody>
  </table>
</div>

<style>
  .scroll-container {
    flex: 0 1 auto;
    min-height: 0;
    overflow: auto;
    padding-right: var(--body-padding);
    position: relative;
    --overflow-shadow-size: 0.75rem;
    --overflow-shadow-color: rgba(0, 0, 0, 0.4);
    --clip-path-size: calc(-1 * var(--overflow-shadow-size));
    --overflow-shadow: 0 0 var(--overflow-shadow-size)
      var(--overflow-shadow-color);
  }
  table {
    flex: 0 1 auto;
    overflow: auto;
    position: relative;
    border-spacing: 0;
    --border-width: 1px;
    --border-color: #e7e7e7;
  }
  thead tr:first-child {
    /**
     * This, along with the somewhat complex border CSS on `.cell-wrapper` is a
     * hacky way of getting collapsing borders.
     *
     * We can't use `border-collapse: collapse;` because it doesn't play well
     * with `thead` being sticky. We also can't set a border on `table` for the
     * same reason. In those cases the borders end up scrolling when we don't
     * want them to scroll.
     */
    --border-top-width: var(--border-width);
  }

  thead {
    display: table-header-group;
    position: sticky;
    z-index: 2;
    top: 0;
  }

  .has-overflow-top thead {
    box-shadow: var(--overflow-shadow);
    clip-path: inset(0 0 var(--clip-path-size) 0);
  }
  .has-overflow-bottom {
    box-shadow: 0 -1rem var(--overflow-shadow-size) -1rem
      var(--overflow-shadow-color) inset;
  }
</style>
