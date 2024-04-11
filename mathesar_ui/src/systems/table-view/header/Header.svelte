<script lang="ts">
  import { first } from 'iter-tools';

  import type { TableEntry } from '@mathesar/api/types/tables';
  import { ContextMenu } from '@mathesar/component-library';
  import {
    SheetCellResizer,
    SheetColumnCreationCell,
    SheetColumnHeaderCell,
    SheetHeader,
  } from '@mathesar/components/sheet';
  import SheetOriginCell from '@mathesar/components/sheet/cells/SheetOriginCell.svelte';
  import type { ProcessedColumn } from '@mathesar/stores/table-data';
  import {
    ID_ADD_NEW_COLUMN,
    ID_ROW_CONTROL_COLUMN,
    getTabularDataStoreFromContext,
  } from '@mathesar/stores/table-data';
  import { saveColumnOrder } from '@mathesar/stores/tables';
  import { Draggable, Droppable } from './drag-and-drop';
  import ColumnHeaderContextMenu from './header-cell/ColumnHeaderContextMenu.svelte';
  import HeaderCell from './header-cell/HeaderCell.svelte';
  import NewColumnCell from './new-column-cell/NewColumnCell.svelte';

  const tabularData = getTabularDataStoreFromContext();

  export let hasNewColumnButton = false;
  export let columnOrder: number[];
  export let table: Pick<TableEntry, 'id' | 'settings' | 'schema'>;

  $: columnOrder = columnOrder ?? [];
  $: columnOrderString = columnOrder.map(String);
  $: ({ selection, processedColumns } = $tabularData);

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
      if ($selection.columnIds.has(id)) {
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
          columnLocation={columnOrderString.indexOf(columnId.toString())}
          {isSelected}
        >
          <HeaderCell {processedColumn} {isSelected} />
        </Droppable>
      </Draggable>
      <SheetCellResizer columnIdentifierKey={columnId} />
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
