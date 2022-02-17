<script lang="ts">
  import { afterUpdate, tick } from 'svelte';
  import {
    isCellActive,
    isCellBeingEdited,
    scrollBasedOnActiveCell,
  } from '@mathesar/stores/table-data';
  import type {
    ColumnPosition,
    TableRecord,
    Column,
    Display,
    RecordsData,
  } from '@mathesar/stores/table-data/types';
  import CellValue from '@mathesar/components/CellValue.svelte';
  import CellInput from './CellInput.svelte';

  export let recordsData: RecordsData;
  export let display: Display;
  export let columnPosition: ColumnPosition | undefined = undefined;
  export let row: TableRecord;
  export let column: Column;
  export let value: unknown = undefined;

  $: ({ activeCell } = display);
  $: isActive = $activeCell && isCellActive($activeCell, row, column);
  $: isBeingEdited =
    !!$activeCell && isCellBeingEdited($activeCell, row, column);

  let cellRef: HTMLElement;

  afterUpdate(() => {
    if (!isBeingEdited && isActive) {
      cellRef?.focus();
    }
  });

  async function handleKeyDown(event: KeyboardEvent) {
    const type = display.handleKeyEventsOnActiveCell(event.key);
    if (type) {
      event.stopPropagation();
      event.preventDefault();

      if (type === 'moved') {
        await tick();
        scrollBasedOnActiveCell();
      }
    }
  }
</script>

<div
  bind:this={cellRef}
  class="cell"
  class:is-active={isActive}
  class:is-in-edit={isBeingEdited}
  class:is-pk={column.primary_key}
  style="
      width:{columnPosition?.width ?? 0}px;
      left:{columnPosition?.left ?? 0}px;
    "
  tabindex={-1}
  on:keydown={handleKeyDown}
>
  <div
    class="content"
    on:mousedown={() => display.selectCell(row, column)}
    on:dblclick={() => display.editCell(row, column)}
  >
    {#if typeof value !== 'undefined'}
      <CellValue {value} />
    {/if}
  </div>

  {#if isBeingEdited}
    <CellInput
      bind:value
      {recordsData}
      {row}
      {column}
      on:keydown={handleKeyDown}
    />
  {/if}

  {#if !row.__state || row.__state === 'loading'}
    <div class="loader" />
  {/if}
</div>
