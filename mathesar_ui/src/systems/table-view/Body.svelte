<script lang="ts">
  import { SheetVirtualRows } from '@mathesar/components/sheet';
  import { parseCellId } from '@mathesar/components/sheet/cellIds';
  import {
    GROUP_HEADER_ROW_HEIGHT_PX,
    HELP_TEXT_ROW_HEIGHT_PX,
    ROW_HEIGHT_PX,
  } from '@mathesar/geometry';
  import {
    type DisplayRowDescriptor,
    type Row as RowType,
    getTabularDataStoreFromContext,
    isDraftRecordRow,
    isGroupHeaderRow,
    isHelpTextRow,
    isPersistedRecordRow,
    isPlaceholderRecordRow,
  } from '@mathesar/stores/table-data';

  import Row from './row/Row.svelte';
  import ScrollAndRowHeightHandler from './ScrollAndRowHeightHandler.svelte';

  const tabularData = getTabularDataStoreFromContext();

  export let usesVirtualList = false;

  $: ({ table, display, canInsertRecords, selection } = $tabularData);
  $: ({ oid } = table);
  $: ({ displayRowDescriptors, placeholderRowId } = display);

  const SheetVirtualRowsForTable = SheetVirtualRows<DisplayRowDescriptor>;

  function getRowSize(desc: DisplayRowDescriptor) {
    const { row } = desc;
    if (isHelpTextRow(row)) {
      return HELP_TEXT_ROW_HEIGHT_PX;
    }
    if (isGroupHeaderRow(row)) {
      return GROUP_HEADER_ROW_HEIGHT_PX;
    }
    return ROW_HEIGHT_PX;
  }

  /** See notes in `records.ts.README.md` about different row identifiers */
  function getIterationKey(rowDescriptor: DisplayRowDescriptor): string {
    if (!rowDescriptor) {
      // Should ideally never happen
      throw new Error('Row descriptor missing');
    }
    return rowDescriptor.row.identifier;
  }

  function isPoolRow(row: RowType): boolean {
    return isPersistedRecordRow(row) || isDraftRecordRow(row);
  }

  // The id here is the same as the row identifier, which is used as the iteration key
  $: activeRowId = $selection.activeCellId
    ? parseCellId($selection.activeCellId).rowId
    : undefined;

  $: rowIndexByKey = new Map(
    $displayRowDescriptors.map((d, i) => [getIterationKey(d), i]),
  );

  $: alwaysRenderRows = (() => {
    const keys: string[] = [];
    if ($canInsertRecords) keys.push($placeholderRowId);
    if (activeRowId !== undefined) {
      const idx = rowIndexByKey.get(activeRowId);
      const row =
        idx !== undefined ? $displayRowDescriptors[idx]?.row : undefined;
      if (row && isPoolRow(row)) keys.push(activeRowId);
    }
    return keys;
  })();
</script>

{#key oid}
  {#if usesVirtualList}
    <SheetVirtualRowsForTable
      rows={$displayRowDescriptors}
      paddingBottom={30}
      rowSize={getRowSize}
      rowKeyForSlotPooling={(desc) => ({
        key: getIterationKey(desc),
        recyclable: desc ? isPoolRow(desc.row) : false,
      })}
      {alwaysRenderRows}
      indexByKey={(key) => rowIndexByKey.get(key)}
      let:items
      let:api
    >
      <ScrollAndRowHeightHandler {api} />
      {#each items as item (item.key)}
        {@const shouldRender = !(
          item.row &&
          isPlaceholderRecordRow(item.row.row) &&
          !$canInsertRecords
        )}
        {#if item.row && shouldRender}
          <Row style={item.style} row={item.row.row} rowDescriptor={item.row} />
        {/if}
      {/each}
    </SheetVirtualRowsForTable>
  {:else}
    {#each $displayRowDescriptors as displayRowDescriptor (displayRowDescriptor)}
      <Row
        style={{
          position: 'relative',
          height: getRowSize(displayRowDescriptor),
        }}
        row={displayRowDescriptor.row}
        rowDescriptor={displayRowDescriptor}
      />
    {/each}
  {/if}
{/key}
