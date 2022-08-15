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
  import { getPkValueInRecord } from './recordSelectorUtils';

  const tabularData = getTabularDataStoreFromContext();

  export let submitPkValue: (v: string | number) => void;
  export let submitNewRecord: (v: Iterable<[number, unknown]>) => void;

  interface RecordSelection {
    type: 'record';
    index: number;
  }
  interface GhostSelection {
    type: 'ghost';
  }
  type Selection = RecordSelection | GhostSelection;

  let selection: Selection = { type: 'record', index: 0 };

  $: ({ display, recordsData, meta, columnsDataStore } = $tabularData);
  $: recordsStore = recordsData.savedRecords;
  $: ({ searchFuzzy } = meta);
  $: records = $recordsStore;
  $: rowWidthStore = display.rowWidth;
  $: rowWidth = $rowWidthStore;
  $: rowStyle = `width: ${rowWidth as number}px; height: ${rowHeightPx}px;`;
  $: showGhostRow = $searchFuzzy.size > 0;
  $: indexIsSelected = (index: number) =>
    selection.type === 'record' && selection.index === index;
  $: ({ columns } = $columnsDataStore);

  function selectPrevious() {
    if (selection.type === 'ghost') {
      return;
    }
    selection =
      selection.index === 0
        ? { type: 'ghost' }
        : { type: 'record', index: selection.index - 1 };
  }

  function selectNext() {
    selection =
      selection.type === 'ghost'
        ? { type: 'record', index: 0 }
        : {
            type: 'record',
            index: Math.min(selection.index + 1, records.length - 1),
          };
  }

  function getPkValue(row: Row): string | number {
    const { record } = row;
    if (!record) {
      throw new Error('No record found within row.');
    }
    return getPkValueInRecord(record, columns);
  }

  function submitSelection(selection: Selection) {
    if (selection.type === 'record') {
      submitIndex(selection.index);
    } else {
      submitGhost();
    }
  }

  function submitIndex(index: number) {
    submitPkValue(getPkValue(records[index]));
  }
  async function submitGhost() {
    submitNewRecord($searchFuzzy);
  }

  function handleKeydown(e: KeyboardEvent) {
    let handled = true;
    switch (e.key) {
      case 'ArrowUp':
        selectPrevious();
        break;
      case 'ArrowDown':
        selectNext();
        break;
      case 'Enter':
        submitSelection(selection);
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
  {#if showGhostRow}
    <div class="row ghost" style={rowStyle} on:click={() => submitGhost()}>
      <div class="new-indicator-wrapper"><NewIndicator /></div>
      <CellArranger {display} let:style let:processedColumn let:columnId>
        <CellWrapper {style}>
          <CellFabric
            columnFabric={processedColumn}
            value={$searchFuzzy.get(columnId) ??
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
