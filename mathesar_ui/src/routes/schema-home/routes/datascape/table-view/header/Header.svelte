<script lang="ts">
  import { getTabularDataStoreFromContext } from '@mathesar/stores/table-data';
  import type { Column } from '@mathesar/stores/table-data/types';
  import {
    SheetHeader,
    SheetCell,
    SheetCellResizer,
  } from '@mathesar/components/sheet';
  import HeaderCell from './header-cell/HeaderCell.svelte';
  import NewColumnCell from './new-column-cell/NewColumnCell.svelte';
  import type { ProcessedTableColumnMap } from '../utils';

  const tabularData = getTabularDataStoreFromContext();

  $: ({ columnsDataStore, meta, display, constraintsDataStore } = $tabularData);
  $: ({ horizontalScrollOffset } = display);

  export let processedTableColumnsMap: ProcessedTableColumnMap;

  function addColumn(e: CustomEvent<Partial<Column>>) {
    void columnsDataStore.add(e.detail);
  }
</script>

<SheetHeader bind:horizontalScrollOffset={$horizontalScrollOffset}>
  <SheetCell columnIdentifierKey={-1} isStatic let:htmlAttributes let:style>
    <div {...htmlAttributes} {style} />
  </SheetCell>

  {#each [...processedTableColumnsMap] as [columnId, processedColumn] (columnId)}
    <SheetCell columnIdentifierKey={columnId} let:htmlAttributes let:style>
      <div {...htmlAttributes} {style}>
        <HeaderCell
          {processedColumn}
          {meta}
          {columnsDataStore}
          {constraintsDataStore}
        />
        <SheetCellResizer columnIdentifierKey={columnId} />
      </div>
    </SheetCell>
  {/each}

  <SheetCell columnIdentifierKey={-2} let:htmlAttributes let:style>
    <div {...htmlAttributes} {style}>
      <NewColumnCell
        columns={$columnsDataStore.columns}
        on:addColumn={addColumn}
      />
    </div>
  </SheetCell>
</SheetHeader>
