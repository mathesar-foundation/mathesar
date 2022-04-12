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
  import CellWrapper from './common/CellWrapper.svelte';

  type Option = $$Generic;

  const dispatch = createEventDispatcher();

  const id = getGloballyUniqueId();

  export let isActive = false;
  export let value: Option | null | undefined = undefined;
  export let readonly = false;
  export let disabled = false;
  export let options: Option[] = [];
  export let getSelectedOptionsFromValue: (
    value: Option | null | undefined,
  ) => Option[];
  export let getValueFromSelectedOptions: (values: Option[]) => Option | null;
  export let getLabel: (value: Option | null | undefined) => string = (_val) =>
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
        if (!disabled && !readonly) {
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
    {readonly}
    {disabled}
    on:mousedown={handleMouseDown}
    on:click={() => checkAndToggle(api)}
    on:keydown={(e) => handleKeyDown(e, api, isOpen)}
  >
    {#if value === null}
      <Null />
    {:else if typeof value !== 'undefined'}
      {getLabel(value)}
    {/if}

    {#if isActive}
      <Icon data={faAngleDown} />
    {/if}
  </CellWrapper>

  <AttachableDropdown
    trigger={cellRef}
    {isOpen}
    on:close={() => handleDropdownClose(api)}
  >
    <ListBoxOptions {id} />
  </AttachableDropdown>
</ListBox>
