<script lang="ts">
  import { onMount } from 'svelte';

  // TODO: Remove route dependency in systems
  import RowCellBackgrounds from '@mathesar/systems/table-view/row/RowCellBackgrounds.svelte';

  import { Spinner } from '@mathesar-component-library';
  import type { Column } from '@mathesar/api/tables/columns';
  import CellFabric from '@mathesar/components/cell-fabric/CellFabric.svelte';
  import { storeToGetRecordPageUrl } from '@mathesar/stores/storeBasedUrls';
  import {
    rowHasSavedRecord,
    getTabularDataStoreFromContext,
    type RecordRow,
  } from '@mathesar/stores/table-data';
  import { tables } from '@mathesar/stores/tables';
  import { rowHeightPx } from '@mathesar/geometry';
  import {
    renderTransitiveRecordSummary,
    buildInputData,
  } from '@mathesar/stores/table-data/record-summaries/recordSummaryUtils';
  import CellArranger from './CellArranger.svelte';
  import CellWrapper from './CellWrapper.svelte';
  import RecordSelectorRow from './RecordSelectorRow.svelte';
  import type { RecordSelectorPurpose } from './recordSelectorTypes';
  import { getPkValueInRecord } from './recordSelectorUtils';
  import type { RecordSelectorResult } from './RecordSelectorController';

  const tabularData = getTabularDataStoreFromContext();

  export let tableId: number;
  export let rowType: RecordSelectorPurpose;
  export let submitResult: (result: RecordSelectorResult) => void;
  export let fkColumnWithFocus: Column | undefined = undefined;
  export let hasSearchQueries = false;
  export let selectionIndex: number;

  $: ({ display, recordsData, columnsDataStore, isLoading } = $tabularData);
  $: recordsStore = recordsData.savedRecords;
  $: ({ recordSummaries } = recordsData);
  $: records = $recordsStore;
  $: resultCount = records.length;
  $: rowWidthStore = display.rowWidth;
  $: rowWidth = $rowWidthStore;
  $: rowStyle = `width: ${rowWidth as number}px; height: ${rowHeightPx}px;`;
  $: indexIsSelected = (index: number) => selectionIndex === index;
  $: ({ columns } = $columnsDataStore);

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
    if (rowType === 'dataEntry') {
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

  onMount(() => {
    window.addEventListener('keydown', handleKeydown, { capture: true });
    return () => {
      window.removeEventListener('keydown', handleKeydown, { capture: true });
    };
  });
</script>

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
          <CellWrapper {style}>
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

<style>
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
</style>
