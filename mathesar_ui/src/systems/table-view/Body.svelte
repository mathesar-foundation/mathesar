<script lang="ts">
  import { getTabularDataStoreFromContext } from '@mathesar/stores/table-data';
  import { SheetVirtualRows } from '@mathesar/components/sheet';
  import RowComponent from './row/Row.svelte';
  import ScrollAndResetHandler from './ScrollAndResetHandler.svelte';
  import {
    rowHeightPx,
    helpTextRowHeightPx,
    groupHeaderRowHeightPx,
  } from './geometry';

  const tabularData = getTabularDataStoreFromContext();

  $: ({ id, recordsData, display } = $tabularData);
  $: ({ displayableRecords } = display);

  function getItemSize(index: number) {
    const allRecords = $displayableRecords;
    const record = allRecords?.[index];
    if (record) {
      if (record.isNewHelpText) {
        return helpTextRowHeightPx;
      }
      if (record.isGroupHeader) {
        return groupHeaderRowHeightPx;
      }
    }
    return rowHeightPx;
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
  <SheetVirtualRows
    itemCount={$displayableRecords.length}
    paddingBottom={30}
    itemSize={getItemSize}
    itemKey={(index) => recordsData.getIterationKey(index)}
    let:items
    let:api
  >
    <ScrollAndResetHandler {api} />
    {#each items as item (item.key)}
      {#if $displayableRecords[item.index]}
        <RowComponent
          style={item.style}
          bind:row={$displayableRecords[item.index]}
        />
      {/if}
    {/each}
  </SheetVirtualRows>
{/key}
