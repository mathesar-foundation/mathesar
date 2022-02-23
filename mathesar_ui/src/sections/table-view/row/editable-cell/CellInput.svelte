<script lang="ts">
  import { onDestroy } from 'svelte';
  import { DynamicInput } from '@mathesar-component-library';
  import type {
    TableRecord,
    Column,
    RecordsData,
  } from '@mathesar/stores/table-data/types';
  import { getInputAttributes, getInputProps } from './utils';

  export let recordsData: RecordsData;
  export let row: TableRecord;
  export let column: Column;
  export let value: unknown = undefined;

  let isNullDisplayed = false;
  let timer: number;

  $: isNullDisplayed = value === null;
  $: inputProps = getInputProps(column);
  $: inputAttrs = getInputAttributes(column);

  onDestroy(() => {
    clearTimeout(timer);
  });

  function setValue(val: unknown) {
    if (value !== val) {
      value = val;
      if (row.__isNew) {
        void recordsData.createOrUpdateRecord(row, column);
      } else {
        void recordsData.updateCell(row, column);
      }
    }
  }

  function handleValueChange(event: CustomEvent<{ value: unknown }>) {
    isNullDisplayed = false;
    window.clearTimeout(timer);
    timer = window.setTimeout(() => {
      setValue(event.detail.value);
    }, 500);
  }

  function clearTimerAndSetValue(event: CustomEvent<{ value: unknown }>) {
    window.clearTimeout(timer);
    setValue(event.detail.value);
  }

  function handleSpecialKeyDown(e: CustomEvent<{ key: string, value: unknown }>) {
    switch (e.detail.key) {
      case 'Enter':
      case 'Escape':
      case 'Tab':
        clearTimerAndSetValue(e);
        break;
      default:
        break;
    }
  }
</script>

<DynamicInput
  class="cell-input-box {isNullDisplayed ? 'is-null-displayed' : ''}"
  {...inputProps}
  {...inputAttrs}
  focusOnMount={true}
  {value}
  on:update={handleValueChange}
  on:specialKeyDown={handleSpecialKeyDown}
  on:focusOut={clearTimerAndSetValue}
/>

<style lang="scss">
  @import 'CellInput.scss';
</style>
