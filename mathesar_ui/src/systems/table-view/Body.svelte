<script lang="ts">
  import type { Row as RowObject } from '@mathesar/stores/table-data/records';
  import { getTabularDataStoreFromContext } from '@mathesar/stores/table-data';
  import { SheetVirtualRows } from '@mathesar/components/sheet';
  import Row from './row/Row.svelte';
  import ScrollAndResetHandler from './ScrollAndResetHandler.svelte';
  import {
    rowHeightPx,
    helpTextRowHeightPx,
    groupHeaderRowHeightPx,
  } from './geometry';

  const tabularData = getTabularDataStoreFromContext();

  export let usesVirtualList = false;

  $: ({ id, recordsData, display } = $tabularData);
  $: ({ displayableRecords } = display);

  function getItemSizeFromRow(row: RowObject) {
    if (row.isNewHelpText) {
      return helpTextRowHeightPx;
    }
    if (row.isGroupHeader) {
      return groupHeaderRowHeightPx;
    }
    return rowHeightPx;
  }

  function getItemSizeFromIndex(index: number) {
    const allRecords = $displayableRecords;
    const record = allRecords?.[index];
    return record ? getItemSizeFromRow(record) : rowHeightPx;
  }

  function checkAndResetActiveCell(e: Event) {
    const target = e.target as HTMLElement;
    const targetMissing = !document.body.contains(target);
    let clearActiveCell = false;

    if (targetMissing) {
      const focusedElementNotWithinEditableCell =
        !document.activeElement ||
        (!document.activeElement.closest('.editable-cell') &&
          !document.activeElement.closest('.retain-active-cell'));
      clearActiveCell = focusedElementNotWithinEditableCell;
    } else {
      const targetNotWithinEditableCell =
        !target.closest('.editable-cell') &&
        !target.closest('.retain-active-cell');
      clearActiveCell = targetNotWithinEditableCell;
    }

    if (clearActiveCell) {
      display.resetActiveCell();
    }
  }
</script>

<svelte:window
  on:keydown={checkAndResetActiveCell}
  on:mousedown={checkAndResetActiveCell}
/>

{#key id}
  {#if usesVirtualList}
    <SheetVirtualRows
      itemCount={$displayableRecords.length}
      paddingBottom={30}
      itemSize={getItemSizeFromIndex}
      itemKey={(index) => recordsData.getIterationKey(index)}
      let:items
      let:api
    >
      <ScrollAndResetHandler {api} />
      {#each items as item (item.key)}
        {#if $displayableRecords[item.index]}
          <Row style={item.style} bind:row={$displayableRecords[item.index]} />
        {/if}
      {/each}
    </SheetVirtualRows>
  {:else}
    {#each $displayableRecords as displayableRecord}
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
