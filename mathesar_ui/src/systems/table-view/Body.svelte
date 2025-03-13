<script lang="ts">
  import { SheetVirtualRows } from '@mathesar/components/sheet';
  import {
    GROUP_HEADER_ROW_HEIGHT_PX,
    HELP_TEXT_ROW_HEIGHT_PX,
    ROW_HEIGHT_PX,
  } from '@mathesar/geometry';
  import {
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
  $: ({ allRows } = display);
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
  function getIterationKey(index: number, row: RowType | undefined): string {
    if (row) {
      return row.identifier;
    }
    return `__index_${index}`;
  }

  function getItemSizeFromIndex(index: number) {
    const record = $allRows?.[index];
    return record ? getItemSizeFromRow(record) : ROW_HEIGHT_PX;
  }
</script>

{#key oid}
  {#if usesVirtualList}
    <SheetVirtualRows
      itemCount={$allRows.length}
      paddingBottom={30}
      itemSize={getItemSizeFromIndex}
      itemKey={(index) => getIterationKey(index, $allRows[index])}
      let:items
      let:api
    >
      <ScrollAndRowHeightHandler {api} />
      {#each items as item (item.key)}
        {#if $allRows[item.index] && !(isPlaceholderRecordRow($allRows[item.index]) && !canAddRow)}
          <Row style={item.style} bind:row={$allRows[item.index]} />
        {/if}
      {/each}
    </SheetVirtualRows>
  {:else}
    {#each $allRows as row (row)}
      <Row
        style={{
          position: 'relative',
          height: getItemSizeFromRow(row),
        }}
        {row}
      />
    {/each}
  {/if}
{/key}
