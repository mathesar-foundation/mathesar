<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import Default from '@mathesar/components/Default.svelte';
  import LinkedRecord from '@mathesar/components/LinkedRecord.svelte';
  // eslint-disable-next-line import/no-cycle
  import { getRecordSelectorFromContext } from '@mathesar/systems/record-selector/RecordSelectorController';
  import CellWrapper from '../CellWrapper.svelte';
  import type { LinkedRecordCellProps } from '../typeDefinitions';

  type $$Props = LinkedRecordCellProps;

  const dispatch = createEventDispatcher();
  const recordSelector = getRecordSelectorFromContext();

  export let isActive: $$Props['isActive'];
  export let value: $$Props['value'] = undefined;
  export let disabled: $$Props['disabled'];
  export let tableId: $$Props['tableId'];

  async function launchRecordSelector() {
    const newValue = await recordSelector.acquireUserInput({ tableId });
    if (newValue === undefined) {
      return;
    }
    value = newValue;
    dispatch('update', { value });

    // This is a band-aid to make the cell remain selected after opening and
    // closing the record selector. I'm not sure why we lose the cell selection
    // when the record selector closes. It would be good to figure out why and
    // fix it somewhere else.
    dispatch('activate');
  }

  function handleWrapperKeyDown(e: KeyboardEvent) {
    switch (e.key) {
      case 'Enter':
        if (isActive) {
          void launchRecordSelector();
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
    if (!isActive) {
      dispatch('activate');
    }
  }
</script>

<CellWrapper
  {isActive}
  {disabled}
  on:activate
  on:keydown={handleWrapperKeyDown}
  on:mousedown={handleMouseDown}
  on:dblclick={launchRecordSelector}
>
  {#if value === undefined}
    <Default />
  {:else}
    <LinkedRecord primaryKeyCellValue={value} />
  {/if}
</CellWrapper>
