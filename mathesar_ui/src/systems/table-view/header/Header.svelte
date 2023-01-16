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
  import { ContextMenu } from '@mathesar/component-library';
  import ColumnHeaderContextMenu from './header-cell/ColumnHeaderContextMenu.svelte';

  const tabularData = getTabularDataStoreFromContext();

  export let hasNewColumnButton = false;

  $: ({ selection, processedColumns } = $tabularData);
  $: ({ selectedCells, columnsSelectedWhenTheTableIsEmpty } = selection);
</script>

<SheetHeader>
  <SheetCell
    columnIdentifierKey={ID_ROW_CONTROL_COLUMN}
    isStatic
    isControlCell
    let:htmlAttributes
    let:style
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
        />
        <SheetCellResizer columnIdentifierKey={columnId} />
        <ContextMenu>
          <ColumnHeaderContextMenu {processedColumn} />
        </ContextMenu>
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
