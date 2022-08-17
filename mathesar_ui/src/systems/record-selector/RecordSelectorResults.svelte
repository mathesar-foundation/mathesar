<script lang="ts">
  import { onMount } from 'svelte';

  // TODO: Remove route dependency in systems
  import RowCellBackgrounds from '@mathesar/systems/table-view/row/RowCellBackgrounds.svelte';

  import type { Column } from '@mathesar/api/tables/columns';
  import CellFabric from '@mathesar/components/cell-fabric/CellFabric.svelte';
  import KeyboardKey from '@mathesar/components/KeyboardKey.svelte';
  import type { Row } from '@mathesar/stores/table-data/records';
  import { rowHasRecord } from '@mathesar/stores/table-data/records';
  import { getTabularDataStoreFromContext } from '@mathesar/stores/table-data/tabularData';
  import { rowHeightPx } from '@mathesar/systems/table-view/geometry';
  import CellArranger from './CellArranger.svelte';
  import CellWrapper from './CellWrapper.svelte';
  import NewIndicator from './NewIndicator.svelte';
  import type { RecordSelectorSelection } from './recordSelectorTypes';
  import {
    findNearestValidSelection,
    getPkValueInRecord,
    getValidOffsetSelection,
  } from './recordSelectorUtils';

  const tabularData = getTabularDataStoreFromContext();

  export let submitPkValue: (v: string | number) => void;
  export let submitNewRecord: (v: Iterable<[number, unknown]>) => void;
  export let activeColumnIsFk = false;
  export let activeColumn: Column | undefined = undefined;

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

  $: ({ display, recordsData, meta, columnsDataStore, isLoading } =
    $tabularData);
  $: recordsStore = recordsData.savedRecords;
  $: ({ searchFuzzy } = meta);
  $: records = $recordsStore;
  $: resultCount = records.length;
  $: rowWidthStore = display.rowWidth;
  $: rowWidth = $rowWidthStore;
  $: rowStyle = `width: ${rowWidth as number}px; height: ${rowHeightPx}px;`;
  $: hasSearchQueries = $searchFuzzy.size > 0;
  $: hasGhostRow = hasSearchQueries;
  $: indexIsSelected = (index: number) =>
    selection.type === 'record' && selection.index === index;
  $: ({ columns } = $columnsDataStore);
  $: keyComboToSubmit = `${activeColumnIsFk ? 'Shift+' : ''}Enter`;

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
        // When we have a FK search cell selected, we use `Enter` to open the
        // nested selector. That event is handled by LinkedRecordInput, so we
        // don't need to handle it here -- we just need to make sure to _not_
        // handle other events here in that case. We still let the user submit
        // the selected record by using Shift+Enter.
        if (!activeColumnIsFk || e.shiftKey) {
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

<div class="record-selector-results" class:loading={$isLoading}>
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
  {:else}
    <div class="no-results">
      No {#if hasSearchQueries}matching{:else}existing{/if} records
    </div>
  {/each}

  <div class="tips">
    {#if activeColumnIsFk}
      <div>
        <KeyboardKey>Enter</KeyboardKey>: Input a value for
        {activeColumn?.name}
      </div>
    {/if}
    <div>
      <KeyboardKey>{keyComboToSubmit}</KeyboardKey>:
      {#if selection.type === 'ghost'}
        <strong>Create new record</strong>, select it, and exit.
      {:else}
        Choose selected record and exit.
      {/if}
    </div>
    <div>
      <KeyboardKey>Up</KeyboardKey>/<KeyboardKey>Down</KeyboardKey>: Modify
      selection.
    </div>
  </div>
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
  .no-results {
    padding: 1.5rem;
    text-align: center;
    color: var(--color-gray-dark);
  }
  .tips {
    margin-top: 0.7rem;
    font-size: var(--text-size-x-small);
    color: var(--color-gray-dark);
    display: flex;
  }
  .tips > * + * {
    margin-left: 1.5rem;
  }

  .record-selector-results.loading .no-results,
  .record-selector-results.loading .tips {
    display: none;
  }
</style>
