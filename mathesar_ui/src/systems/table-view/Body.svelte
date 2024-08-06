<script lang="ts">
  import { SheetVirtualRows } from '@mathesar/components/sheet';
  import {
    groupHeaderRowHeightPx,
    helpTextRowHeightPx,
    rowHeightPx,
  } from '@mathesar/geometry';
  import {
    type Row as RowType,
    getRowKey,
    getTabularDataStoreFromContext,
    isGroupHeaderRow,
    isHelpTextRow,
    isPlaceholderRow,
  } from '@mathesar/stores/table-data';

  import Row from './row/Row.svelte';
  import ScrollAndResetHandler from './ScrollAndResetHandler.svelte';

  const tabularData = getTabularDataStoreFromContext();

  export let usesVirtualList = false;

  $: ({ table, display, columnsDataStore } = $tabularData);
  $: ({ oid } = table);
  $: ({ displayableRecords } = display);
  $: ({ pkColumn } = columnsDataStore);

  function getItemSizeFromRow(row: RowType) {
    if (isHelpTextRow(row)) {
      return helpTextRowHeightPx;
    }
    if (isGroupHeaderRow(row)) {
      return groupHeaderRowHeightPx;
    }
    return rowHeightPx;
  }

  function getIterationKey(index: number, row: RowType | undefined): string {
    if (row) {
      return getRowKey(row, $pkColumn?.id);
    }
    return `__index_${index}`;
  }

  function getItemSizeFromIndex(index: number) {
    const allRecords = $displayableRecords;
    const record = allRecords?.[index];
    return record ? getItemSizeFromRow(record) : rowHeightPx;
  }
</script>

{#key oid}
  {#if usesVirtualList}
    <SheetVirtualRows
      itemCount={$displayableRecords.length}
      paddingBottom={30}
      itemSize={getItemSizeFromIndex}
      itemKey={(index) => getIterationKey(index, $displayableRecords[index])}
      let:items
      let:api
    >
      <ScrollAndResetHandler {api} />
      {#each items as item (item.key)}
        {#if $displayableRecords[item.index] && !isPlaceholderRow($displayableRecords[item.index])}
          <Row style={item.style} bind:row={$displayableRecords[item.index]} />
        {/if}
      {/each}
    </SheetVirtualRows>
  {:else}
    {#each $displayableRecords as displayableRecord (displayableRecord)}
      <Row
        style={{
          position: 'relative',
          height: getItemSizeFromRow(displayableRecord),
        }}
        row={displayableRecord}
      />
    {/each}
  {/if}
{/key}
