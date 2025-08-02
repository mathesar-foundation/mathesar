<script lang="ts">
  import { SheetVirtualRows } from '@mathesar/components/sheet';
  import { modalRecordViewContext } from '@mathesar/contexts/modalRecordViewContext';
  import {
    GROUP_HEADER_ROW_HEIGHT_PX,
    HELP_TEXT_ROW_HEIGHT_PX,
    ROW_HEIGHT_PX,
  } from '@mathesar/geometry';
  import RecordStore from '@mathesar/stores/RecordStore';
  import {
    type DisplayRowDescriptor,
    type Row as RowType,
    getTabularDataStoreFromContext,
    isGroupHeaderRow,
    isHelpTextRow,
    isPlaceholderRecordRow,
  } from '@mathesar/stores/table-data';
  import { currentTablesMap } from '@mathesar/stores/tables';

  import Row from './row/Row.svelte';
  import ScrollAndRowHeightHandler from './ScrollAndRowHeightHandler.svelte';

  const tabularData = getTabularDataStoreFromContext();
  const modalRecordView = modalRecordViewContext.get();

  export let usesVirtualList = false;

  $: ({ table, display, canInsertRecords } = $tabularData);
  $: ({ oid } = table);
  $: ({ displayRowDescriptors } = display);

  function getItemSizeFromRow(row: RowType) {
    if (isHelpTextRow(row)) {
      return HELP_TEXT_ROW_HEIGHT_PX;
    }
    if (isGroupHeaderRow(row)) {
      return GROUP_HEADER_ROW_HEIGHT_PX;
    }
    return ROW_HEIGHT_PX;
  }

  /** See notes in `records.ts.README.md` about different row identifiers */
  function getIterationKey(
    index: number,
    rowDescriptor: DisplayRowDescriptor | undefined,
  ): string {
    if (rowDescriptor) {
      return rowDescriptor.row.identifier;
    }
    return `__index_${index}`;
  }

  function getItemSizeFromIndex(index: number) {
    const row = $displayRowDescriptors?.[index].row;
    return row ? getItemSizeFromRow(row) : ROW_HEIGHT_PX;
  }

  function quickViewRecord(_tableOid: number, _recordId: unknown) {
    if (!modalRecordView) return;
    if (_recordId === undefined) return;
    const containingTable = $currentTablesMap.get(_tableOid);
    if (!containingTable) return;
    const recordStore = new RecordStore({
      table: containingTable,
      recordPk: String(_recordId),
    });
    modalRecordView.open(recordStore);
  }
</script>

{#key oid}
  {#if usesVirtualList}
    <SheetVirtualRows
      itemCount={$displayRowDescriptors.length}
      paddingBottom={30}
      itemSize={getItemSizeFromIndex}
      itemKey={(index) => getIterationKey(index, $displayRowDescriptors[index])}
      let:items
      let:api
    >
      <ScrollAndRowHeightHandler {api} />
      {#each items as item (item.key)}
        {@const shouldRender = !(
          isPlaceholderRecordRow($displayRowDescriptors[item.index].row) &&
          !$canInsertRecords
        )}
        {#if $displayRowDescriptors[item.index] && shouldRender}
          <Row
            style={item.style}
            bind:row={$displayRowDescriptors[item.index].row}
            rowDescriptor={$displayRowDescriptors[item.index]}
            {quickViewRecord}
          />
        {/if}
      {/each}
    </SheetVirtualRows>
  {:else}
    {#each $displayRowDescriptors as displayRowDescriptor (displayRowDescriptor)}
      <Row
        style={{
          position: 'relative',
          height: getItemSizeFromRow(displayRowDescriptor.row),
        }}
        bind:row={displayRowDescriptor.row}
        rowDescriptor={displayRowDescriptor}
        {quickViewRecord}
      />
    {/each}
  {/if}
{/key}
