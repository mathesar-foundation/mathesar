<script lang="ts">
  import type { Writable } from 'svelte/store';

  import type { RequestStatus } from '@mathesar/api/utils/requestUtils';
  import CellFabric from '@mathesar/components/cell-fabric/CellFabric.svelte';
  import { SheetCell } from '@mathesar/components/sheet';
  import { makeCellId } from '@mathesar/components/sheet/cellIds';
  import type SheetSelection from '@mathesar/components/sheet/selection/SheetSelection';
  import { handleKeyboardEventOnCell } from '@mathesar/components/sheet/sheetKeyboardUtils';
  import type QueryInspector from '../QueryInspector';
  import { getRowSelectionId, type QueryRow } from '../QueryRunner';
  import type { ProcessedQueryOutputColumn } from '../utils';

  export let column: ProcessedQueryOutputColumn;
  export let row: QueryRow | undefined;
  export let recordRunState: RequestStatus['state'] | undefined;
  export let selection: Writable<SheetSelection>;
  export let inspector: QueryInspector;

  $: cellId = row && makeCellId(getRowSelectionId(row), column.id);
  $: isActive = cellId === $selection.activeCellId;
</script>

<SheetCell columnIdentifierKey={column.id} let:htmlAttributes let:style>
  <div {...htmlAttributes} {style} class="cell" class:is-active={isActive}>
    {#if row || recordRunState === 'processing'}
      <CellFabric
        {isActive}
        isSelected={$selection.cellIds.has(cellId ?? '')}
        columnFabric={column}
        value={row?.record[column.id]}
        showAsSkeleton={recordRunState === 'processing'}
        disabled={true}
        on:movementKeyDown={({ detail }) =>
          handleKeyboardEventOnCell(detail.originalEvent, selection)}
        on:activate={() => {
          // // TODO_3037
          // if (row) {
          //   selection.activateCell(row, processedQueryColumn);
          //   inspector.selectCellTab();
          // }
        }}
        on:onSelectionStart={() => {
          // // TODO_3037
          // if (row) {
          //   selection.onStartSelection(row, processedQueryColumn);
          // }
        }}
        on:onMouseEnterCellWhileSelection={() => {
          // // TODO_3037
          // if (row) {
          //   // This enables the click + drag to
          //   // select multiple cells
          //   selection.onMouseEnterCellWhileSelection(row, processedQueryColumn);
          // }
        }}
      />
    {/if}
  </div>
</SheetCell>

<style lang="scss">
  .cell {
    user-select: none;
    -webkit-user-select: none; /* Safari */
    background: var(--cell-bg-color-base);

    &.is-active {
      z-index: var(--z-index__sheet__active-cell);
      border-color: transparent;
      min-height: 100%;
      height: auto;
    }
  }
</style>
