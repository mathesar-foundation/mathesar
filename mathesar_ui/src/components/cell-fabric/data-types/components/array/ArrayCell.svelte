<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { isDefinedNonNullable, Chip, TextInput } from '@mathesar-component-library';
  import CellValue from '@mathesar/components/CellValue.svelte';
  import Null from '@mathesar/components/Null.svelte';
  import { labeledCount } from '@mathesar/utils/languageUtils';
  import CellWrapper from '../CellWrapper.svelte';
  import type { ArrayCellProps } from '../typeDefinitions';

  type $$Props = ArrayCellProps;
  type Value = $$Generic;

  const dispatch = createEventDispatcher();

  export let isActive: $$Props['isActive'];
  export let isSelectedInRange: $$Props['isSelectedInRange'];
  export let value: $$Props['value'] = undefined;
  export let disabled: $$Props['disabled'];
  export let isIndependentOfSheet: $$Props['isIndependentOfSheet'];
  export let formatElementForDisplay: $$Props['formatElementForDisplay'];

  let isEditMode = false;
  let lastSavedValue: Value | undefined | null = undefined;

  function initLastSavedValue() {
    lastSavedValue = value;
  }

  function revertValue() {
    value = lastSavedValue;
  }

  function handleWrapperKeyDown(e: KeyboardEvent) {
    switch (e.key) {
      case 'Enter':
        if (isEditMode) {
          resetEditMode();
        } else {
          setModeToEdit();
        }
        // Preventing default behaviour here. Interesting problem: If this is
        // not prevented, the textarea gets a new line break. Needs more digging
        // down.
        e.preventDefault();
        break;
      case 'Escape':
        revertValue();
        resetEditMode();
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

  function dispatchUpdate() {
    if (value === lastSavedValue) {
      return;
    }
    initLastSavedValue();
    dispatch('update', {
      value,
    });
  }

  function setModeToEdit() {
    if (!disabled) {
      isEditMode = true;
    }
  }

  function resetEditMode() {
    isEditMode = false;
  }

  function handleInputBlur() {
    dispatchUpdate();
    resetEditMode();
  }

  onMount(initLastSavedValue);

</script>

<CellWrapper
  {isActive}
  {isSelectedInRange}
  {disabled}
  {isIndependentOfSheet}
  let:handleInputBlur
  let:handleInputKeydown
  on:mouseenter
  on:keydown={handleWrapperKeyDown}
  on:mousedown={handleMouseDown}
  on:activate
  on:update
  on:dblclick={setModeToEdit}
>
  {#if isEditMode}
    <TextInput
      focusOnMount={true}
      {disabled}
      bind:value
      on:blur={handleInputBlur}
      on:keydown={handleInputKeydown}
    />
  {:else}
    <CellValue {value}>
      {#if isDefinedNonNullable(value)}
        {#if isIndependentOfSheet}
          <div class="count">{labeledCount(value, 'values')}</div>
        {/if}
        <div>
          {#each value as entry}
            <Chip
              display={isIndependentOfSheet ? 'inline-block' : 'inline'}
              background="var(--slate-200)"
            >
              {#if entry === null}
                <Null />
              {:else}
                {formatElementForDisplay(entry)}
              {/if}
            </Chip>
          {/each}
        </div>
      {/if}
    </CellValue>
  {/if}
</CellWrapper>

<style lang="scss">
  .count {
    font-weight: 500;
    margin-bottom: 0.8rem;
  }
</style>
