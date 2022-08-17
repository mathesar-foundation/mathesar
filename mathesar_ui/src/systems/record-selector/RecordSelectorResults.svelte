<script lang="ts">
  import { onMount } from 'svelte';

  // TODO: Remove route dependency in systems
  import RowCellBackgrounds from '@mathesar/systems/table-view/row/RowCellBackgrounds.svelte';

  import CellFabric from '@mathesar/components/cell-fabric/CellFabric.svelte';
  import type { Row } from '@mathesar/stores/table-data/records';
  import { rowHasRecord } from '@mathesar/stores/table-data/records';
  import { getTabularDataStoreFromContext } from '@mathesar/stores/table-data/tabularData';
  import { rowHeightPx } from '@mathesar/systems/table-view/geometry';
  import CellArranger from './CellArranger.svelte';
  import CellWrapper from './CellWrapper.svelte';
  import NewIndicator from './NewIndicator.svelte';
  import {
    findNearestValidSelection,
    getPkValueInRecord,
    getValidOffsetSelection,
  } from './recordSelectorUtils';
  import type { RecordSelectorSelection } from './recordSelectorTypes';

  const tabularData = getTabularDataStoreFromContext();

  export let submitPkValue: (v: string | number) => void;
  export let submitNewRecord: (v: Iterable<[number, unknown]>) => void;

  let selection: RecordSelectorSelection = { type: 'record', index: 0 };

  /**
   * The ghost row will appear and disappear based on whether the user has
   * entered values into the search fields. Here's the situation that this
   * variable helps us with:
   *
   * 1. The user record selector loads with 10 rows.
   * 1. The user enters a search term which filters the number of rows to 0.
   * 1. The ghost row is automatically selected (good).
   * 1. The user modifies their search term, allowing 5 rows to display.
   * 1. At this point, we'd like to automatically select the first result row
   *    (instead of the ghost row) because we know that the user never manually
   *    selected the ghost row. If we leave the ghost row selected, there's a
   *    chance the user (if they're not paying close attention) could select the
   *    ghost, inadvertently creating a new record. We want to make sure that
   *    when they select the ghost row, they mean it!
   * 1. Because we also want to support the user case where they've manually
   *    selected the ghost row and are continuing to build a new record, we need
   *    this variable.
   */
  let userHasManuallySelectedGhostRow = false;

  $: ({ display, recordsData, meta, columnsDataStore } = $tabularData);
  $: recordsStore = recordsData.savedRecords;
  $: ({ searchFuzzy } = meta);
  $: records = $recordsStore;
  $: resultCount = records.length;
  $: rowWidthStore = display.rowWidth;
  $: rowWidth = $rowWidthStore;
  $: rowStyle = `width: ${rowWidth as number}px; height: ${rowHeightPx}px;`;
  $: hasGhostRow = $searchFuzzy.size > 0;
  $: indexIsSelected = (index: number) =>
    selection.type === 'record' && selection.index === index;
  $: ({ columns } = $columnsDataStore);

  $: selection = findNearestValidSelection({
    selection,
    resultCount,
    hasGhostRow,
    userHasManuallySelectedGhostRow,
  });

  function moveSelectionByOffset(offset: number) {
    userHasManuallySelectedGhostRow =
      userHasManuallySelectedGhostRow ||
      (selection.type === 'record' && selection.index === 0 && offset < 0);
    selection = getValidOffsetSelection(
      {
        selection,
        resultCount,
        hasGhostRow,
        userHasManuallySelectedGhostRow,
      },
      offset,
    );
  }

  function getPkValue(row: Row): string | number {
    const { record } = row;
    if (!record) {
      throw new Error('No record found within row.');
    }
    return getPkValueInRecord(record, columns);
  }

  function submitIndex(index: number) {
    submitPkValue(getPkValue(records[index]));
  }

  function submitGhost() {
    submitNewRecord($searchFuzzy);
  }

  function submitSelection() {
    if (selection.type === 'record') {
      submitIndex(selection.index);
    } else {
      submitGhost();
    }
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
        submitSelection();
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
  {#if hasGhostRow}
    <div class="row ghost" style={rowStyle} on:click={() => submitGhost()}>
      <div class="new-indicator-wrapper"><NewIndicator /></div>
      <CellArranger {display} let:style let:processedColumn let:column>
        <CellWrapper {style}>
          <CellFabric
            columnFabric={processedColumn}
            value={$searchFuzzy.get(column.id) ??
              (processedColumn.column.nullable ? null : undefined)}
            disabled
          />
          <RowCellBackgrounds isSelected={selection.type === 'ghost'} />
          <!-- TODO -->
        </CellWrapper>
      </CellArranger>
    </div>
  {/if}
  {#each records as row, index}
    <div class="row" style={rowStyle} on:click={() => submitIndex(index)}>
      <CellArranger {display} let:style let:processedColumn>
        <CellWrapper {style}>
          <CellFabric
            columnFabric={processedColumn}
            value={row?.record?.[processedColumn.column.id]}
            disabled
            showAsSkeleton={!rowHasRecord(row)}
          />
          <RowCellBackgrounds isSelected={indexIsSelected(index)} />
        </CellWrapper>
      </CellArranger>
    </div>
  {/each}
</div>

<style>
  .row {
    position: relative;
    cursor: pointer;
  }
  .row:not(:hover) :global(.cell-bg-row-hover) {
    display: none;
  }
  .new-indicator-wrapper {
    position: absolute;
    height: 100%;
    display: flex;
    align-items: center;
    left: -0.5rem;
  }
  .ghost {
    border-bottom: dashed 2px #aaa;
  }
  .ghost :global(.cell-wrapper) {
    opacity: 75%;
  }
</style>
