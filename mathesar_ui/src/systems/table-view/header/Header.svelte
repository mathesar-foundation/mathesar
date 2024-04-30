<script lang="ts">
  import {
    getTabularDataStoreFromContext,
    ID_ADD_NEW_COLUMN,
    ID_ROW_CONTROL_COLUMN,
  } from '@mathesar/stores/table-data';
  import {
    SheetHeader,
    SheetCell,
    SheetCellResizer,
    isColumnSelected,
  } from '@mathesar/components/sheet';
  import type { ProcessedColumn } from '@mathesar/stores/table-data';
  import { saveColumnOrder } from '@mathesar/stores/tables';
  import type { TableEntry } from '@mathesar/api/rest/types/tables';
  import { ContextMenu } from '@mathesar/component-library';
  import HeaderCell from './header-cell/HeaderCell.svelte';
  import NewColumnCell from './new-column-cell/NewColumnCell.svelte';
  import { Draggable, Droppable } from './drag-and-drop';
  import ColumnHeaderContextMenu from './header-cell/ColumnHeaderContextMenu.svelte';

  const tabularData = getTabularDataStoreFromContext();

  export let hasNewColumnButton = false;
  export let columnOrder: number[];
  export let table: Pick<TableEntry, 'id' | 'settings' | 'schema'>;

  $: columnOrder = columnOrder ?? [];
  $: columnOrderString = columnOrder.map(String);

  $: ({ selection, processedColumns } = $tabularData);
  $: ({
    selectedCells,
    columnsSelectedWhenTheTableIsEmpty,
    selectionInProgress,
  } = selection);
  $: selectedColumnIds = selection.getSelectedUniqueColumnsId(
    $selectedCells,
    $columnsSelectedWhenTheTableIsEmpty,
  );

  let locationOfFirstDraggedColumn: number | undefined = undefined;
  let selectedColumnIdsOrdered: string[] = [];
  let newColumnOrder: string[] = [];

  function dragColumn() {
    // Keep only IDs for which the column exists
    for (const columnId of $processedColumns.keys()) {
      const columnIdString = columnId.toString();
      columnOrderString = [...new Set(columnOrderString)];
      if (!columnOrderString.includes(columnIdString)) {
        columnOrderString = [...columnOrderString, columnIdString];
      }
    }
    columnOrderString = columnOrderString;
    // Remove selected column IDs and keep their order
    for (const id of columnOrderString) {
      if (selectedColumnIds.map(String).includes(id)) {
        selectedColumnIdsOrdered.push(id);
        if (!locationOfFirstDraggedColumn) {
          locationOfFirstDraggedColumn = columnOrderString.indexOf(id);
        }
      } else {
        newColumnOrder.push(id);
      }
    }
  }

  function dropColumn(columnDroppedOn?: ProcessedColumn) {
    // Early exit if a column is dropped in the same place.
    // Should only be done for single column if non-continuous selection is allowed.
    if (
      selectedColumnIds.length > 0 &&
      columnDroppedOn &&
      selectedColumnIds[0] === columnDroppedOn.id
    ) {
      // Reset drag information
      locationOfFirstDraggedColumn = undefined;
      selectedColumnIdsOrdered = [];
      newColumnOrder = [];
      return;
    }

    // Insert selected column IDs after the column where they are dropped
    // if that column is to the right, else insert it before
    if (columnDroppedOn) {
      newColumnOrder.splice(
        columnOrderString.indexOf(columnDroppedOn.id.toString()),
        0,
        ...selectedColumnIdsOrdered,
      );
    } else {
      // If the column is dropped on the ID column, columnDroppedOn is undefined and we can insert at the beginning.
      newColumnOrder.splice(0, 0, ...selectedColumnIdsOrdered);
    }

    void saveColumnOrder(table, newColumnOrder.map(Number));

    // Reset drag information
    locationOfFirstDraggedColumn = undefined;
    selectedColumnIdsOrdered = [];
    newColumnOrder = [];
  }
</script>

<SheetHeader>
  <SheetCell
    columnIdentifierKey={ID_ROW_CONTROL_COLUMN}
    isStatic
    isControlCell
    let:htmlAttributes
    let:style
  >
    <Droppable
      on:drop={() => dropColumn()}
      on:dragover={(e) => e.preventDefault()}
      locationOfFirstDraggedColumn={0}
      columnLocation={-1}
    >
      <div {...htmlAttributes} {style} />
    </Droppable>
  </SheetCell>

  {#each [...$processedColumns] as [columnId, processedColumn] (columnId)}
    <SheetCell columnIdentifierKey={columnId} let:htmlAttributes let:style>
      <div>
        <div {...htmlAttributes} {style}>
          <Draggable
            on:dragstart={() => dragColumn()}
            column={processedColumn}
            {selection}
            selectionInProgress={$selectionInProgress}
          >
            <Droppable
              on:drop={() => dropColumn(processedColumn)}
              on:dragover={(e) => e.preventDefault()}
              {locationOfFirstDraggedColumn}
              columnLocation={columnOrderString.indexOf(columnId.toString())}
              isSelected={isColumnSelected(
                $selectedCells,
                $columnsSelectedWhenTheTableIsEmpty,
                processedColumn,
              )}
            >
              <HeaderCell
                {processedColumn}
                isSelected={isColumnSelected(
                  $selectedCells,
                  $columnsSelectedWhenTheTableIsEmpty,
                  processedColumn,
                )}
                on:mousedown={() =>
                  selection.onColumnSelectionStart(processedColumn)}
                on:mouseenter={() =>
                  selection.onMouseEnterColumnHeaderWhileSelection(
                    processedColumn,
                  )}
              />
            </Droppable>
          </Draggable>
          <SheetCellResizer columnIdentifierKey={columnId} />
          <ContextMenu>
            <ColumnHeaderContextMenu {processedColumn} />
          </ContextMenu>
        </div>
      </div>
    </SheetCell>
  {/each}

  {#if hasNewColumnButton}
    <SheetCell
      columnIdentifierKey={ID_ADD_NEW_COLUMN}
      let:htmlAttributes
      let:style
    >
      <div {...htmlAttributes} class="new-column-cell" {style}>
        <NewColumnCell />
      </div>
    </SheetCell>
  {/if}
</SheetHeader>

<style lang="scss">
  .new-column-cell {
    padding: 0 0.2rem;
  }
</style>
