<script lang="ts">
  import { tick, createEventDispatcher } from 'svelte';
  import Null from '@mathesar/components/Null.svelte';

  const dispatch = createEventDispatcher();

  export let isActive = false;
  export let value: string | null | undefined = undefined;
  export let readonly = false;
  export let disabled = false;
  let classes = '';
  export { classes as class };

  let cellRef: HTMLElement;
  let isEditMode = false;

  async function focusCell(_isActive: boolean, _isEditMode: boolean) {
    await tick();
    if (_isActive && !_isEditMode) {
      cellRef?.focus();
    }
  }

  $: void focusCell(isActive, isEditMode);

  function setModeToEdit() {
    if (!readonly && !disabled) {
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

<div
  class="cell-wrapper {classes}"
  class:is-edit-mode={isEditMode}
  class:is-active={isActive}
  class:readonly
  bind:this={cellRef}
  on:dblclick={setModeToEdit}
  on:keydown={handleKeyDown}
  on:mousedown={() => dispatch('activate')}
  tabindex={-1}
>
  {#if isEditMode}
    <slot {handleInputBlur} {handleInputKeydown} />
  {:else}
    <div class="content">
      {#if value === null}
        <Null />
      {:else if value}
        {value}
      {/if}
    </div>
  {/if}
</div>

<style lang="scss">
  .cell-wrapper {
    .content {
      overflow: hidden;
      position: relative;
      text-overflow: ellipsis;
    }

    :global(.input-element) {
      box-shadow: none;

      &:focus {
        border: none;
      }
    }

    &.is-edit-mode {
      padding: 0px;
      box-shadow: 0 0 0 3px #428af4, 0 0 8px #000000 !important;
    }

    &:not(.is-active) {
      .content {
        white-space: nowrap;
      }
    }

    &.is-active:global(.multi-line-truncate) .content {
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
    }
  }
</style>
