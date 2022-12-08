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
  export let recordSummary: $$Props['recordSummary'] = undefined;
  export let setRecordSummary: Required<$$Props>['setRecordSummary'] = () => {};
  export let disabled: $$Props['disabled'];
  export let tableId: $$Props['tableId'];
  export let isIndependentOfSheet: $$Props['isIndependentOfSheet'];

  let wasActiveBeforeClick = false;

  $: hasValue = value !== undefined && value !== null;

  async function launchRecordSelector(event?: MouseEvent) {
    if (disabled) {
      return;
    }
    event?.stopPropagation();
    const result = await recordSelector.acquireUserInput({ tableId });
    if (result === undefined) {
      return;
    }
    value = result.recordId;
    setRecordSummary(String(result.recordId), result.recordSummary);
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
  {isIndependentOfSheet}
  on:activate
  on:mouseenter
  on:keydown={handleWrapperKeyDown}
  on:mousedown={handleMouseDown}
  on:click={handleClick}
  on:dblclick={launchRecordSelector}
  hasPadding={false}
>
  <div class="linked-record-cell" class:disabled>
    <div class="value">
      {#if hasValue}
        <LinkedRecord recordId={value} {recordSummary} />
      {:else if value === undefined}
        <Default />
      {:else}
        <Null />
      {/if}
    </div>
    {#if !disabled}
      <button
        class="dropdown-button passthrough"
        on:click={launchRecordSelector}
        label="Pick a record"
        title="Pick a record"
      >
        <Icon {...iconExpandDown} />
      </button>
    {/if}
  </div>
</CellWrapper>

<style>
  .linked-record-cell {
    flex: 1 0 auto;
    display: flex;
    justify-content: space-between;
  }
  .value {
    padding-left: var(--cell-padding);
    align-self: center;
    overflow: hidden;
    width: max-content;
    max-width: 100%;
  }
  .disabled .value {
    padding-right: var(--cell-padding);
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
