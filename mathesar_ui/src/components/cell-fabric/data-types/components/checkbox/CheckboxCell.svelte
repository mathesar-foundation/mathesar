<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { Checkbox } from '@mathesar-component-library';
  import Default from '@mathesar/components/Default.svelte';
  import CellWrapper from '../CellWrapper.svelte';
  import type { CheckBoxCellProps } from '../typeDefinitions';

  type $$Props = CheckBoxCellProps;

  const dispatch = createEventDispatcher();

  export let isActive: $$Props['isActive'];
  export let isSelectedInRange: $$Props['isSelectedInRange'];
  export let value: $$Props['value'] = undefined;
  export let disabled: $$Props['disabled'];
  export let isProcessing: $$Props['isProcessing'];

  let cellRef: HTMLElement;
  let isFirstActivated = false;

  function dispatchUpdate() {
    dispatch('update', { value });
  }

  function handleWrapperKeyDown(e: KeyboardEvent) {
    switch (e.key) {
      case 'Enter':
        if (isActive) {
          value = !value;
          dispatchUpdate();
        }
        break;
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

  function checkAndToggle(e: Event) {
    if (!disabled && isActive && e.target === cellRef && !isFirstActivated) {
      value = !value;
      dispatchUpdate();
    }
    isFirstActivated = false;
    cellRef?.focus();
  }

  function handleMouseDown() {
    if (!isActive) {
      isFirstActivated = true;
      dispatch('activate');
    }
  }
</script>

<CellWrapper
  bind:element={cellRef}
  {isActive}
  {isSelectedInRange}
  {disabled}
  on:mouseenter
  on:keydown={handleWrapperKeyDown}
  on:click={checkAndToggle}
  on:mousedown={handleMouseDown}
>
  {#if value === undefined}
    <Default />
  {:else}
    <Checkbox
      bind:checked={value}
      allowIndeterminate={true}
      disabled={isProcessing}
      on:change={dispatchUpdate}
    />
  {/if}
</CellWrapper>
