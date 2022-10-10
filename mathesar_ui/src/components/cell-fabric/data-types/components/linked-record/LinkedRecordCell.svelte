<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  import { Icon, iconExpandDown } from '@mathesar-component-library';
  import Default from '@mathesar/components/Default.svelte';
  import Null from '@mathesar/components/Null.svelte';
  import LinkedRecord from '@mathesar/components/LinkedRecord.svelte';
  // eslint-disable-next-line import/no-cycle
  import { getRecordSelectorFromContext } from '@mathesar/systems/record-selector/RecordSelectorController';
  import CellWrapper from '../CellWrapper.svelte';
  import type { LinkedRecordCellProps } from '../typeDefinitions';

  type $$Props = LinkedRecordCellProps;

  const dispatch = createEventDispatcher();
  const recordSelector = getRecordSelectorFromContext();

  export let isActive: $$Props['isActive'];
  export let isSelectedInRange: $$Props['isSelectedInRange'];
  export let value: $$Props['value'] = undefined;
  export let getRecordSummary: Required<$$Props>['getRecordSummary'] = () =>
    undefined;
  export let disabled: $$Props['disabled'];
  export let tableId: $$Props['tableId'];

  let wasActiveBeforeClick = false;

  $: hasValue = value !== undefined && value !== null;
  $: recordSummary = getRecordSummary(String(value));

  async function launchRecordSelector(event?: MouseEvent) {
    event?.stopPropagation();
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
    wasActiveBeforeClick = isActive;
    dispatch('activate');
  }

  function handleClick() {
    if (wasActiveBeforeClick) {
      void launchRecordSelector();
    }
  }
</script>

<CellWrapper
  {isActive}
  {isSelectedInRange}
  {disabled}
  on:activate
  on:mouseenter
  on:keydown={handleWrapperKeyDown}
  on:mousedown={handleMouseDown}
  on:click={handleClick}
  on:dblclick={launchRecordSelector}
  hasPadding={false}
>
  <div class="linked-record-cell">
    <div class="value">
      {#if hasValue}
        <LinkedRecord recordId={value} {recordSummary} />
      {:else if value === undefined}
        <Default />
      {:else}
        <Null />
      {/if}
    </div>
    <button
      class="dropdown-button passthrough"
      on:click={launchRecordSelector}
      {disabled}
      label="Pick a record"
      title="Pick a record"
    >
      <Icon {...iconExpandDown} />
    </button>
  </div>
</CellWrapper>

<style>
  .linked-record-cell {
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    width: 100%;
    display: grid;
    grid-template: auto / 1fr auto;
  }
  .value {
    padding-left: var(--cell-padding);
    align-self: center;
    overflow: hidden;
  }
  .dropdown-button {
    cursor: pointer;
    padding: 0 var(--cell-padding);
    display: flex;
    align-items: center;
    color: var(--color-gray-dark);
  }
  .dropdown-button:hover {
    color: var(--color-text);
  }
</style>
