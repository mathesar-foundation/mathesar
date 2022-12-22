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

  function dropColumn(e: DragEvent, column: ProcessedColumn) {
    column_order = column_order ?? [];
    for (let column_id of $processedColumns.keys())  {
      if (!column_order.includes(column_id)) {
        column_order.push(column_id);
      }
    }
    column_order.splice(column_order.indexOf(draggedColumn.id), 1);
    column_order.splice(column_order.indexOf(column.id)+1, 0, draggedColumn.id);
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
    on:dragover={(e) => {e.preventDefault()}}
  >
    <div {...htmlAttributes} {style} />
  </SheetCell>

  {#each [...$processedColumns] as [columnId, processedColumn] (columnId)}
    <SheetCell columnIdentifierKey={columnId} let:htmlAttributes let:style>
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
          on:dragstart={(e) => dragStart(e, processedColumn)}
          on:drop={(e) => dropColumn(e, processedColumn)}
          on:dragover={(e) => {e.preventDefault()}}
        />
        <SheetCellResizer columnIdentifierKey={columnId} />
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
