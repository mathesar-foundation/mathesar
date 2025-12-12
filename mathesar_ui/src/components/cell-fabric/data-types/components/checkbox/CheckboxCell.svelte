<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  import Default from '@mathesar/components/Default.svelte';
  import { Checkbox, compareWholeValues } from '@mathesar-component-library';

  import CellWrapper from '../CellWrapper.svelte';
  import type { CheckBoxCellProps } from '../typeDefinitions';

  type $$Props = CheckBoxCellProps;

  const dispatch = createEventDispatcher();

  export let isActive: $$Props['isActive'];
  export let value: $$Props['value'] = undefined;
  export let disabled: $$Props['disabled'];
  export let searchValue: $$Props['searchValue'] = undefined;
  export let isProcessing: $$Props['isProcessing'];
  export let isIndependentOfSheet: $$Props['isIndependentOfSheet'];

  let cellRef: HTMLElement;
  let shouldToggleOnMouseUp = false;

  $: valueComparisonOutcome = compareWholeValues(searchValue, value);

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

  function handleMouseDown() {
    shouldToggleOnMouseUp = isActive;
  }

  function handleMouseLeave() {
    shouldToggleOnMouseUp = false;
  }

  function handleMouseUp() {
    if (!disabled && isActive && shouldToggleOnMouseUp) {
      value = !value;
      dispatchUpdate();
    }
  }
</script>

<CellWrapper
  bind:element={cellRef}
  {isActive}
  {disabled}
  {isIndependentOfSheet}
  {valueComparisonOutcome}
  on:mouseenter
  on:mouseleave={handleMouseLeave}
  on:keydown={handleWrapperKeyDown}
  on:mousedown={handleMouseDown}
  on:mouseup={handleMouseUp}
>
  {#if value === undefined}
    <Default />
  {:else}
    <Checkbox
      bind:checked={value}
      allowIndeterminate={true}
      disabled={disabled || isProcessing}
      on:change={dispatchUpdate}
    />
  {/if}
</CellWrapper>
