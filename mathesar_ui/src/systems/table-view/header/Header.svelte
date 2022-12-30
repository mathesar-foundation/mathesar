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
  import { Draggable, Droppable } from './drag-and-drop';
  import HeaderCell from './header-cell/HeaderCell.svelte';
  import NewColumnCell from './new-column-cell/NewColumnCell.svelte';
  import type { ProcessedColumn } from '@mathesar/stores/table-data';
  import { saveColumnOrder } from '@mathesar/stores/tables';
  import type { TableEntry } from '@mathesar/api/tables';

  const tabularData = getTabularDataStoreFromContext();

  export let hasNewColumnButton = false;
  export let column_order: number[];
  export let table: TableEntry;

  $: ({ selection, processedColumns } = $tabularData);
  $: ({ selectedCells, columnsSelectedWhenTheTableIsEmpty } = selection);

  let draggedColumn: ProcessedColumn;

  function dragStart(e: DragEvent, column: ProcessedColumn) {
    draggedColumn = column;
  }

  function dropColumn(e: DragEvent, columnDroppedOn?: ProcessedColumn) {
    column_order = column_order ?? [];

    for (let column_id of $processedColumns.keys())  {
      if (!column_order.includes(column_id)) {
        column_order.push(column_id);
      }
    }
    column_order.splice(column_order.indexOf(draggedColumn.id), 1);

    if (columnDroppedOn) {
      column_order.splice(column_order.indexOf(columnDroppedOn.id)+1, 0, draggedColumn.id);
      saveColumnOrder(table, column_order);//
    } else {
      column_order.splice(0, 0, draggedColumn.id);
    }
    saveColumnOrder(table, column_order);//
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
      on:drop={(e) => dropColumn(e)}
      on:dragover={(e) => {e.preventDefault()}}
      >
        <div {...htmlAttributes} {style} />
      </Droppable>
    </SheetCell>


  {#each [...$processedColumns] as [columnId, processedColumn] (columnId)}

    <SheetCell columnIdentifierKey={columnId} let:htmlAttributes let:style>
      <Draggable
      isSelected={isColumnSelected(
        $selectedCells,
        $columnsSelectedWhenTheTableIsEmpty,
        processedColumn,
      )}
      on:dragstart={(e) => dragStart(e, processedColumn)}
      >
        <Droppable
        on:drop={(e) => dropColumn(e, processedColumn)}
        >
          <div {...htmlAttributes} {style}>
            <HeaderCell
              {processedColumn}
              isSelected={isColumnSelected(
                $selectedCells,
                $columnsSelectedWhenTheTableIsEmpty,
                processedColumn,
              )}
              on:mousedown={() => selection.onColumnSelectionStart(processedColumn)}
              on:mouseenter={() =>
                selection.onMouseEnterColumnHeaderWhileSelection(processedColumn)}
            />
            <SheetCellResizer columnIdentifierKey={columnId} />
          </div>
        </Droppable>
      </Draggable>
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
