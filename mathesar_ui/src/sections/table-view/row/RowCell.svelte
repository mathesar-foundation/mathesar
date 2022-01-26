<script lang="ts">
  import { afterUpdate, onDestroy, tick } from 'svelte';
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

  export let recordsData: RecordsData;
  export let display: Display;
  export let columnPosition: ColumnPosition | undefined = undefined;
  export let row: TableRecord;
  export let column: Column;
  export let value: unknown = undefined;

  $: ({ activeCell } = display);
  $: isActive = $activeCell && isCellActive($activeCell, row, column);
  $: isBeingEdited = $activeCell && isCellBeingEdited($activeCell, row, column);

  let cellRef: HTMLElement;
  let inputRef: HTMLInputElement;
  let timer: number;

  afterUpdate(() => {
    if (inputRef) {
      inputRef.focus();
    } else if (isActive) {
      cellRef?.focus();
    }
  });

  onDestroy(() => {
    clearTimeout(timer);
  });

  function setValue(val: string) {
    if (value !== val) {
      value = val;
      if (row.__isNew) {
        void recordsData.createOrUpdateRecord(row, column);
      } else {
        void recordsData.updateCell(row, column);
      }
    }
  }

  function debounceAndSet(event: Event) {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => {
      const val = (event.target as HTMLInputElement).value;
      setValue(val);
    }, 500);
  }

  function onBlur(event: Event) {
    const val = (event.target as HTMLInputElement).value;
    window.clearTimeout(timer);
    setValue(val);
  }

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

  async function handleInputKeyDown(event: KeyboardEvent) {
    if (
      event.key === 'Tab' ||
      event.key === 'Enter' ||
      event.key === 'Escape'
    ) {
      onBlur(event);
    }

    await handleKeyDown(event);
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
    <input
      bind:this={inputRef}
      type="text"
      class="edit-input-box"
      value={typeof value === 'string' || typeof value === 'number'
        ? value
        : ''}
      on:keydown={handleInputKeyDown}
      on:keyup={debounceAndSet}
      on:blur={onBlur}
    />
  {/if}

  {#if !row.__state || row.__state === 'loading'}
    <div class="loader" />
  {/if}
</div>
