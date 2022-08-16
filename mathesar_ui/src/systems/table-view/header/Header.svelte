<script lang="ts">
  import {
    getTabularDataStoreFromContext,
    ID_ADD_NEW_COLUMN,
    ID_ROW_CONTROL_COLUMN,
  } from '@mathesar/stores/table-data';
  import type { Column } from '@mathesar/api/tables/columns';
  import {
    SheetHeader,
    SheetCell,
    SheetCellResizer,
  } from '@mathesar/components/sheet';
  import HeaderCell from './header-cell/HeaderCell.svelte';
  import NewColumnCell from './new-column-cell/NewColumnCell.svelte';

  const tabularData = getTabularDataStoreFromContext();

  $: ({ columnsDataStore, selection, processedColumns } = $tabularData);

  function addColumn(e: CustomEvent<Partial<Column>>) {
    void columnsDataStore.add(e.detail);
  }
</script>

<SheetHeader>
  <SheetCell
    columnIdentifierKey={ID_ROW_CONTROL_COLUMN}
    isStatic
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
          on:click={() =>
            selection.toggleColumnSelection(processedColumn.column)}
        />
        <SheetCellResizer columnIdentifierKey={columnId} />
      </div>
    </SheetCell>
  {/each}

  <SheetCell
    columnIdentifierKey={ID_ADD_NEW_COLUMN}
    let:htmlAttributes
    let:style
  >
    <div {...htmlAttributes} {style}>
      <NewColumnCell
        columns={$columnsDataStore.columns}
        on:addColumn={addColumn}
      />
    </div>
  </SheetCell>
</SheetHeader>
