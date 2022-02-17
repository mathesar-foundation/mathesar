<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import type {
    TableRecord,
    Column,
    RecordsData,
  } from '@mathesar/stores/table-data/types';

  export let recordsData: RecordsData;
  export let row: TableRecord;
  export let column: Column;
  export let value: unknown = undefined;

  let inputRef: HTMLInputElement;
  let isNullDisplayed = false;
  let timer: number;

  $: isNullDisplayed = value === null;

  onMount(() => {
    inputRef.focus();
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

  function hideNullElement() {
    isNullDisplayed = false;
  }

  function handleInputKeyDown(event: KeyboardEvent) {
    if (
      event.key === 'Tab' ||
      event.key === 'Enter' ||
      event.key === 'Escape'
    ) {
      onBlur(event);
    }
  }
</script>

<input
  bind:this={inputRef}
  type="text"
  class="edit-input-box"
  class:is-null-displayed={isNullDisplayed}
  value={typeof value === 'string' || typeof value === 'number' ? value : ''}
  on:keyup={debounceAndSet}
  on:blur={onBlur}
  on:input={hideNullElement}
  on:keydown={handleInputKeyDown}
  on:keydown
/>
