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
  import type { TableEntry } from '@mathesar/api/types/tables';

  const tabularData = getTabularDataStoreFromContext();

  export let hasNewColumnButton = false;
  export let column_order: number[];
  export let table: TableEntry;

  $: ({ selection, processedColumns } = $tabularData);
  $: ({ selectedCells, columnsSelectedWhenTheTableIsEmpty} = selection);
  $: selectedColumnIds =  selection.getSelectedUniqueColumnsId(
      $selectedCells,
      $columnsSelectedWhenTheTableIsEmpty,
    );

  function dropColumn(e: DragEvent, columnDroppedOn?: ProcessedColumn) {
    var columnOrder = column_order ?? [];
    //Keep only IDs for which the column exists
    for (let column_id of $processedColumns.keys())  {
      if (!columnOrder.includes(column_id)) {
        columnOrder.push(column_id);
      }
    }

    var selectedColumnIdsOrdered:number[] = []

    //Remove selected column IDs and keep their order
    const newColumnOrder:number[] = [];
    for (const id of columnOrder) {
      if (selectedColumnIds.includes(id)) {
        selectedColumnIdsOrdered.push(id);
      }
      else {
        newColumnOrder.push(id)
      }
    }

    //Insert selected column IDs after the column where they are dropped
    if (columnDroppedOn) {
      newColumnOrder.splice(columnOrder.indexOf(columnDroppedOn.id)+1, 0, ...selectedColumnIdsOrdered);
    } else {
      // If the column is dropped on the ID column, columnDroppedOn is undefined and we can insert at the beginning.
      newColumnOrder.splice(0, 0, ...selectedColumnIdsOrdered);
    }

    saveColumnOrder(table, newColumnOrder);//
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
              on:click={() => selection.toggleColumnSelection(processedColumn)}
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
