<script lang="ts">
  import { afterUpdate, onDestroy } from 'svelte';
  import { isCellActive, isCellBeingEdited } from '@mathesar/stores/table-data';
  import type {
    ColumnPosition,
    TableRecord,
    TableColumn,
    Display,
    Records,
  } from '@mathesar/stores/table-data/types';

  export let records: Records;
  export let display: Display;
  export let columnPosition: ColumnPosition;
  export let row: TableRecord;
  export let column: TableColumn;

  $: ({ activeCell } = display);
  $: isActive = isCellActive($activeCell, row, column);
  $: isBeingEdited = isCellBeingEdited($activeCell, row, column);

  let inputRef: HTMLElement;
  let timer: number;

  afterUpdate(() => {
    inputRef?.focus();
  });

  onDestroy(() => {
    clearTimeout(timer);
  });

  function setValue(val: string) {
    if (row[column.name] !== val) {
      row[column.name] = val;
      void records.updateRecord(row);
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
    row = { ...row };
  }
</script>

<div class="cell" class:is-active={isActive}
     class:is-in-edit={isBeingEdited}
     class:is-pk={column.primary_key}
     style="width:{columnPosition?.width || 0}px;
      left:{columnPosition?.left || 0}px;">

  <div class="content"
    on:click={() => display.selectCell(row, column)}
    on:dblclick={() => display.editCell(row, column)}>
    {#if typeof row[column.name] !== 'undefined'}
      {#if row[column.name] === null}
        <span class="empty">null</span>
      {:else}
        {row[column.name]}
      {/if}
    {/if}
  </div>

  {#if isBeingEdited}
    <input bind:this={inputRef} type="text" class="edit-input-box"
            value={row[column.name]?.toString() || ''}
            on:keyup={debounceAndSet} on:blur={onBlur}/>
  {/if}

  {#if !row.__state || row.__state === 'loading'}
    <div class="loader"></div>
  {/if}
</div>
