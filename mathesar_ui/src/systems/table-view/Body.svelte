<script lang="ts">
  import { SheetVirtualRows } from '@mathesar/components/sheet';
  import {
    GROUP_HEADER_ROW_HEIGHT_PX,
    HELP_TEXT_ROW_HEIGHT_PX,
    ROW_HEIGHT_PX,
  } from '@mathesar/geometry';
  import {
    type DisplayRowDescriptor,
    type Row as RowType,
    getTabularDataStoreFromContext,
    isGroupHeaderRow,
    isHelpTextRow,
    isPlaceholderRecordRow,
  } from '@mathesar/stores/table-data';

  import Row from './row/Row.svelte';
  import ScrollAndRowHeightHandler from './ScrollAndRowHeightHandler.svelte';

  const tabularData = getTabularDataStoreFromContext();

  export let usesVirtualList = false;

  $: ({ table, display } = $tabularData);
  $: ({ oid } = table);
  $: ({ displayRowDescriptors } = display);
  $: ({ currentRolePrivileges } = table.currentAccess);
  $: canAddRow = $currentRolePrivileges.has('INSERT');

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
          !canAddRow
        )}
        {#if $displayRowDescriptors[item.index] && shouldRender}
          <Row
            style={item.style}
            bind:row={$displayRowDescriptors[item.index].row}
            rowDescriptor={$displayRowDescriptors[item.index]}
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
      />
    {/each}
  {/if}
{/key}
