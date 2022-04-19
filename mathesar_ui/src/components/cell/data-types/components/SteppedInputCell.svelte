<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import Null from '@mathesar/components/Null.svelte';
  import CellWrapper from './CellWrapper.svelte';
  import type { CellTypeProps } from './typeDefinitions';

  const dispatch = createEventDispatcher();

  export let isActive: CellTypeProps['isActive'];
  export let value: CellTypeProps['value'];
  export let disabled: CellTypeProps['disabled'];
  export let multiLineTruncate = false;

  let cellRef: HTMLElement;
  let isEditMode = false;

  function setModeToEdit() {
    if (!disabled) {
      isEditMode = true;
    }
  }

  function resetEditMode() {
    isEditMode = false;
  }

  function handleKeyDown(e: KeyboardEvent) {
    switch (e.key) {
      case 'Enter':
        if (isEditMode) {
          resetEditMode();
        } else {
          setModeToEdit();
        }
        // Preventing default behaviour here
        // Interesting problem: If this is not prevented, the textarea gets a new line break
        // Needs more digging down
        e.preventDefault();
        break;
      case 'Escape':
        resetEditMode();
        break;
      case 'Tab':
        resetEditMode();
        dispatch('movementKeyDown', {
          originalEvent: e,
          key: e.key,
        });
        break;
      case 'ArrowLeft':
      case 'ArrowRight':
      case 'ArrowDown':
      case 'ArrowUp':
        if (!isEditMode) {
          dispatch('movementKeyDown', {
            originalEvent: e,
            key: e.key,
          });
        }
        break;
      default:
        break;
    }
  }

  function dispatchUpdate() {
    dispatch('update', {
      value,
    });
  }

  function handleInputKeydown(e: KeyboardEvent) {
    switch (e.key) {
      case 'Enter':
      case 'Escape':
      case 'Tab':
        dispatchUpdate();
        break;
      default:
        break;
    }
  }

  function handleInputBlur() {
    dispatchUpdate();
    resetEditMode();
  }
</script>

<CellWrapper
  {isActive}
  {disabled}
  bind:element={cellRef}
  on:dblclick={setModeToEdit}
  on:keydown={handleKeyDown}
  on:mousedown={() => dispatch('activate')}
  mode={isEditMode ? 'edit' : 'default'}
  {multiLineTruncate}
>
  {#if isEditMode}
    <slot {handleInputBlur} {handleInputKeydown} />
  {:else}
    <div
      class="content"
      class:nowrap={!isActive}
      class:truncate={isActive && multiLineTruncate}
    >
      {#if value === null}
        <Null />
      {:else if typeof value !== 'undefined'}
        {value}
      {/if}
    </div>
  {/if}
</CellWrapper>

<style lang="scss">
  .content {
    overflow: hidden;
    position: relative;
    text-overflow: ellipsis;

    &.nowrap {
      white-space: nowrap;
    }

    &.truncate {
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
    }
  }
</style>
