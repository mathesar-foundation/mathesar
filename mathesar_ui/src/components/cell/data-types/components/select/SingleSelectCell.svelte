<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { faAngleDown } from '@fortawesome/free-solid-svg-icons';
  import {
    AttachableDropdown,
    ListBox,
    ListBoxOptions,
    getGloballyUniqueId,
    Icon,
  } from '@mathesar-component-library';
  import type { ListBoxApi } from '@mathesar-component-library/types';
  import Null from '@mathesar/components/Null.svelte';
  import CellWrapper from '../CellWrapper.svelte';
  import type { SingleSelectCellProps } from '../typeDefinitions';

  type Option = $$Generic;
  type Value = $$Generic;
  type $$Props = SingleSelectCellProps<Value, Option>;
  type $$DefinedProps = Required<$$Props>;

  const dispatch = createEventDispatcher();

  const id = getGloballyUniqueId();

  export let isActive: $$DefinedProps['isActive'];
  export let value: $$DefinedProps['value'] = undefined;
  export let disabled: $$DefinedProps['disabled'];

  export let options: $$DefinedProps['options'] = [];
  export let getSelectedOptionsFromValue: $$DefinedProps['getSelectedOptionsFromValue'];
  export let getValueFromSelectedOptions: $$DefinedProps['getValueFromSelectedOptions'];
  export let getValueLabel: $$DefinedProps['getValueLabel'] = (_val) =>
    String(_val);

  let cellRef: HTMLElement;
  let isInitiallyActivated = false;

  function checkAndToggle(api: ListBoxApi<Option>) {
    if (isActive && !isInitiallyActivated) {
      api.toggle();
    }
    isInitiallyActivated = false;
  }

  function handleMouseDown() {
    if (!isActive) {
      isInitiallyActivated = true;
      dispatch('activate');
    }
  }

  function handleKeyDown(
    e: KeyboardEvent,
    api: ListBoxApi<Option>,
    isOpen: boolean,
  ) {
    if (['Tab', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      dispatch('movementKeyDown', {
        originalEvent: e,
        key: e.key,
      });
      api.close();
      return;
    }

    if (isOpen) {
      api.handleKeyDown(e);
      return;
    }

    switch (e.key) {
      case 'Enter':
        if (!disabled) {
          api.handleKeyDown(e);
        }
        break;
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

  function setValueFromListBox(values: Option[]) {
    value = getValueFromSelectedOptions(values);
    dispatch('update', { value });
  }

  function handleDropdownClose(api: ListBoxApi<Option>) {
    api.close();
    dispatch('activate');
  }
</script>

<ListBox
  {options}
  selectionType="single"
  value={getSelectedOptionsFromValue(value)}
  on:change={(e) => setValueFromListBox(e.detail)}
  let:api
  let:isOpen
>
  <CellWrapper
    bind:element={cellRef}
    aria-controls={id}
    aria-haspopup="listbox"
    {isActive}
    {disabled}
    on:mousedown={handleMouseDown}
    on:click={() => checkAndToggle(api)}
    on:keydown={(e) => handleKeyDown(e, api, isOpen)}
  >
    <div class="value" class:active={isActive}>
      {#if value === null}
        <Null />
      {:else if typeof value !== 'undefined'}
        {getValueLabel(value)}
      {/if}
    </div>

    {#if isActive}
      <div class="icon">
        <Icon data={faAngleDown} />
      </div>
    {/if}
  </CellWrapper>

  <AttachableDropdown
    trigger={cellRef}
    {isOpen}
    on:close={() => handleDropdownClose(api)}
    class="single-select-cell-dropdown"
  >
    <ListBoxOptions {id} />
  </AttachableDropdown>
</ListBox>

<style lang="scss">
  // This needs to be global since we do not have actual dom
  // elements in this component
  :global(.dropdown.content.single-select-cell-dropdown) {
    border: 1px solid #ccc;
    max-width: 250px;
  }

  .value {
    flex: 1 1 auto;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .icon {
    flex: 0 0 auto;
  }
</style>
