<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { isDefinedNonNullable, Chip } from '@mathesar-component-library';
  import CellValue from '@mathesar/components/CellValue.svelte';
  import CellWrapper from '../CellWrapper.svelte';
  import type { ArrayCellProps } from '../typeDefinitions';

  type $$Props = ArrayCellProps;

  const dispatch = createEventDispatcher();

  export let isActive: $$Props['isActive'];
  export let isSelectedInRange: $$Props['isSelectedInRange'];
  export let value: $$Props['value'] = undefined;
  export let disabled: $$Props['disabled'];

  function handleWrapperKeyDown(e: KeyboardEvent) {
    switch (e.key) {
      case 'Tab':
      case 'ArrowLeft':
      case 'ArrowRight':
      case 'ArrowDown':
      case 'ArrowUp':
        dispatch('movementKeyDown', {
          originalEvent: e,
          key: e.key,
        });
        break;
      default:
        break;
    }
  }

  function handleMouseDown() {
    if (!isActive) {
      dispatch('activate');
    }
  }
</script>

<CellWrapper
  {isActive}
  {isSelectedInRange}
  {disabled}
  on:mouseenter
  on:keydown={handleWrapperKeyDown}
  on:mousedown={handleMouseDown}
>
  <CellValue {value}>
    {#if isDefinedNonNullable(value)}
      {#each value as entry}
        <Chip display="inline" background="var(--slate-200)">{entry}</Chip>
      {/each}
    {/if}
  </CellValue>
</CellWrapper>
