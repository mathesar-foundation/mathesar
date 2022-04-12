<script lang="ts">
  import { tick, createEventDispatcher } from 'svelte';
  import { Checkbox } from '@mathesar-component-library';
  import CellWrapper from './common/CellWrapper.svelte';

  const dispatch = createEventDispatcher();

  export let isActive = false;
  export let value: boolean | null | undefined = undefined;
  export let readonly = false;
  export let disabled = false;

  let cellRef: HTMLElement;
  let isFirstActivated = false;

  async function focusCell(_isActive: boolean) {
    await tick();
    if (_isActive && cellRef) {
      if (!cellRef.contains(document.activeElement)) {
        cellRef.focus();
      }
    }
  }

  $: void focusCell(isActive);

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
    if (
      !disabled &&
      !readonly &&
      isActive &&
      e.target === cellRef &&
      !isFirstActivated
    ) {
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
  {readonly}
  {disabled}
  on:keydown={handleWrapperKeyDown}
  on:click={checkAndToggle}
  on:mousedown={handleMouseDown}
>
  <Checkbox
    bind:checked={value}
    allowIndeterminate={true}
    {disabled}
    on:change={dispatchUpdate}
  />
</CellWrapper>
