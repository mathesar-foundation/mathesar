<script lang="ts">
  import { first } from 'iter-tools';

  import { ContextMenu } from '@mathesar/component-library';
  import {
    SheetCellResizer,
    SheetColumnCreationCell,
    SheetColumnHeaderCell,
    SheetHeader,
  } from '@mathesar/components/sheet';
  import SheetOriginCell from '@mathesar/components/sheet/cells/SheetOriginCell.svelte';
  import type { Table } from '@mathesar/models/Table';
  import {
    ID_ADD_NEW_COLUMN,
    ID_ROW_CONTROL_COLUMN,
    type ProcessedColumn,
    getTabularDataStoreFromContext,
  } from '@mathesar/stores/table-data';
  import { updateTable } from '@mathesar/stores/tables';

  import { Draggable, Droppable } from './drag-and-drop';
  import ColumnHeaderContextMenu from './header-cell/ColumnHeaderContextMenu.svelte';
  import HeaderCell from './header-cell/HeaderCell.svelte';
  import NewColumnCell from './new-column-cell/NewColumnCell.svelte';

  const tabularData = getTabularDataStoreFromContext();

  export let hasNewColumnButton = false;
  export let columnOrder: number[];
  export let table: Table;

  $: columnOrder = columnOrder ?? [];
  $: ({ selection, processedColumns, columnsDataStore } = $tabularData);

  let locationOfFirstDraggedColumn: number | undefined = undefined;
  let selectedColumnIdsOrdered: number[] = [];
  let newColumnOrder: number[] = [];

  function dragColumn() {
    // Keep only IDs for which the column exists
    for (const columnId of $processedColumns.keys()) {
      columnOrder = [...new Set(columnOrder)];
      if (!columnOrder.includes(columnId)) {
        columnOrder = [...columnOrder, columnId];
      }
    }
    columnOrder = columnOrder;
    // Remove selected column IDs and keep their order
    for (const id of columnOrder) {
      if ($selection.columnIds.has(String(id))) {
        selectedColumnIdsOrdered.push(id);
        if (!locationOfFirstDraggedColumn) {
          locationOfFirstDraggedColumn = columnOrder.indexOf(id);
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
      columnDroppedOn &&
      first($selection.columnIds) === String(columnDroppedOn.id)
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
        columnOrder.indexOf(columnDroppedOn.id),
        0,
        ...selectedColumnIdsOrdered,
      );
    } else {
      // If the column is dropped on the ID column, columnDroppedOn is undefined and we can insert at the beginning.
      newColumnOrder.splice(0, 0, ...selectedColumnIdsOrdered);
    }

    void updateTable({
      schema: table.schema,
      table: {
        oid: table.oid,
        metadata: { column_order: newColumnOrder },
      },
    });

    // Reset drag information
    locationOfFirstDraggedColumn = undefined;
    selectedColumnIdsOrdered = [];
    newColumnOrder = [];
  }

  function saveColumnWidth(column: ProcessedColumn, width: number | null) {
    void columnsDataStore.setDisplayOptions(column, { display_width: width });
  }
</script>

<SheetHeader>
  <SheetOriginCell columnIdentifierKey={ID_ROW_CONTROL_COLUMN}>
    <Droppable
      on:drop={() => dropColumn()}
      on:dragover={(e) => e.preventDefault()}
      locationOfFirstDraggedColumn={0}
      columnLocation={-1}
    />
  </SheetOriginCell>

  {#each [...$processedColumns] as [columnId, processedColumn] (columnId)}
    {@const isSelected = $selection.columnIds.has(String(columnId))}
    <SheetColumnHeaderCell columnIdentifierKey={columnId}>
      <Draggable
        on:dragstart={() => dragColumn()}
        column={processedColumn}
        {selection}
      >
        <Droppable
          on:drop={() => dropColumn(processedColumn)}
          on:dragover={(e) => e.preventDefault()}
          {locationOfFirstDraggedColumn}
          columnLocation={columnOrder.indexOf(columnId)}
          {isSelected}
        >
          <HeaderCell {processedColumn} {isSelected} />
        </Droppable>
      </Draggable>
      <SheetCellResizer
        columnIdentifierKey={columnId}
        afterResize={(width) => saveColumnWidth(processedColumn, width)}
        onReset={() => saveColumnWidth(processedColumn, null)}
      />
      <ContextMenu>
        <ColumnHeaderContextMenu {processedColumn} />
      </ContextMenu>
    </SheetColumnHeaderCell>
  {/each}

  {#if hasNewColumnButton}
    <SheetColumnCreationCell columnIdentifierKey={ID_ADD_NEW_COLUMN}>
      <NewColumnCell />
    </SheetColumnCreationCell>
  {/if}
</SheetHeader>
