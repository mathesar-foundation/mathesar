<script lang="ts">
  import { getTabularDataStoreFromContext } from '@mathesar/stores/table-data';
  import type { Column } from '@mathesar/stores/table-data/types';
  import { SheetHeader, SheetHeaderCell } from '@mathesar/components/sheet';
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
  <SheetHeaderCell columnIdentifierKey={-1} isControlCell isResizable={false} />

  {#each [...processedTableColumnsMap] as [columnId, processedColumn] (columnId)}
    <SheetHeaderCell columnIdentifierKey={columnId}>
      <HeaderCell
        {processedColumn}
        {meta}
        {columnsDataStore}
        {constraintsDataStore}
      />
    </SheetHeaderCell>
  {/each}

  <SheetHeaderCell columnIdentifierKey={-2} isResizable={false}>
    <NewColumnCell
      columns={$columnsDataStore.columns}
      on:addColumn={addColumn}
    />
  </SheetHeaderCell>
</SheetHeader>
