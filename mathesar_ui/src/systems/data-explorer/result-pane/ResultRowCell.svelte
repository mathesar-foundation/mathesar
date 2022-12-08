<script lang="ts">
  import { tick } from 'svelte';
  import {
    SheetCell,
    isCellActive,
    scrollBasedOnActiveCell,
    isCellSelected,
  } from '@mathesar/components/sheet';
  import CellFabric from '@mathesar/components/cell-fabric/CellFabric.svelte';
  import type { RequestStatus } from '@mathesar/api/utils/requestUtils';
  import type { QueryRow, QuerySheetSelection } from '../QueryRunner';
  import type { ProcessedQueryOutputColumn } from '../utils';
  import type QueryInspector from '../QueryInspector';

  export let processedQueryColumn: ProcessedQueryOutputColumn;
  export let row: QueryRow | undefined;
  export let recordRunState: RequestStatus['state'] | undefined;
  export let selection: QuerySheetSelection;
  export let inspector: QueryInspector;

  $: ({ activeCell, selectedCells } = selection);
  $: isActive =
    $activeCell && row && isCellActive($activeCell, row, processedQueryColumn);

  /**
   * The name indicates that this boolean is only true when more than one cell
   * is selected. However, because of the bug that [the active cell and selected
   * cells do not remain in sync when using keyboard][1] this boolean is
   * sometimes true even when multiple cells are selected. This is to
   * differentiate between different active and selected cell using blue
   * background styling for selected cell and blue border styling for active
   * cell.
   *
   * The above bug can be fixed when following two conditions are met
   *
   * - We are working on keyboard accessability of the application.
   * - `selectedCells` and `activeCell` are merged in a single store.
   *
   * [1]: https://github.com/centerofci/mathesar/issues/1534
   */
  $: isSelectedInRange =
    row &&
    isCellSelected($selectedCells, row, processedQueryColumn) &&
    $selectedCells.size > 1;

  async function checkTypeAndScroll(type?: string) {
    if (type === 'moved') {
      await tick();
      scrollBasedOnActiveCell();
    }
  }

  async function moveThroughCells(
    event: CustomEvent<{ originalEvent: KeyboardEvent; key: string }>,
  ) {
    const { originalEvent } = event.detail;
    const type = selection.handleKeyEventsOnActiveCell(originalEvent);
    if (type) {
      originalEvent.stopPropagation();
      originalEvent.preventDefault();

      await checkTypeAndScroll(type);
    }
  }
</script>

<SheetCell
  columnIdentifierKey={processedQueryColumn.id}
  let:htmlAttributes
  let:style
>
  <div {...htmlAttributes} {style} class="cell" class:is-active={isActive}>
    {#if row || recordRunState === 'processing'}
      <CellFabric
        {isActive}
        {isSelectedInRange}
        columnFabric={processedQueryColumn}
        value={row?.record[processedQueryColumn.id]}
        showAsSkeleton={recordRunState === 'processing'}
        disabled={true}
        on:movementKeyDown={moveThroughCells}
        on:activate={() => {
          if (row) {
            selection.activateCell(row, processedQueryColumn);
            // Activate event initaites the selection process
            selection.onStartSelection(row, processedQueryColumn);
            inspector.selectCellTab();
          }
        }}
        on:mouseenter={() => {
          if (row) {
            // This enables the click + drag to
            // select multiple cells
            selection.onMouseEnterWhileSelection(row, processedQueryColumn);
          }
        }}
      />
    {/if}
  </div>
</SheetCell>

<style lang="scss">
  .cell {
    user-select: none;
    background: var(--cell-bg-color-base);

    &.is-active {
      z-index: var(--z-index__sheet__active-cell);
      border-color: transparent;
      min-height: 100%;
      height: auto;
    }
  }
</style>
