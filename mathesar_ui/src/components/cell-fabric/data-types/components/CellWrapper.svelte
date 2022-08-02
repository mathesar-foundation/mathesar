<script lang="ts">
  import { tick } from 'svelte';
  import type { HorizontalAlignment } from './typeDefinitions';

  export let element: HTMLElement | undefined = undefined;
  export let isActive = false;
  export let disabled = false;
  export let mode: 'edit' | 'default' = 'default';
  export let multiLineTruncate = false;
  export let hasPadding = true;

  /**
   * This only affects the alignment of the displayed value while in
   * select-mode. It does not affect the alignment of the value within an input
   * during edit mode -- that alignment is controlled by the specific cell input
   * component (e.g. `NumberCellInput`) because the input is also used in other
   * places (e.g. default values and filter conditions).
   */
  export let horizontalAlignment: HorizontalAlignment = 'left';

  async function focusCell(_isActive: boolean, _mode: 'edit' | 'default') {
    await tick();
    if (_isActive && element && _mode !== 'edit') {
      if (!element.contains(document.activeElement)) {
        element.focus();
      }
    }
  }

  $: void focusCell(isActive, mode);
</script>

<div
  class="cell-wrapper"
  class:is-active={isActive}
  class:disabled
  class:is-edit-mode={mode === 'edit'}
  class:truncate={multiLineTruncate}
  class:h-align-right={horizontalAlignment === 'right'}
  class:h-align-center={horizontalAlignment === 'center'}
  class:has-padding={hasPadding}
  bind:this={element}
  on:click
  on:dblclick
  on:mousedown
  on:keydown
  tabindex={-1}
  {...$$restProps}
>
  <slot />
</div>

<style lang="scss">
  .cell-wrapper {
    overflow: hidden;
    position: relative;
    display: flex;
    flex: 1 1 auto;
    min-height: var(--cell-height);
    align-items: center;
    width: 100%;

    &.has-padding {
      padding: 6px 8px;
    }

    &.h-align-right {
      justify-content: flex-end;
    }
    &.h-align-center {
      justify-content: center;
    }

    &.is-active {
      box-shadow: 0 0 0 2px #428af4;
      border-radius: 2px;

      &.disabled {
        box-shadow: 0 0 0 2px #a8a8a8;
      }
    }

    :global(.input-element) {
      box-shadow: none;
      border: none;
    }

    &.is-edit-mode {
      padding: 0px;
      box-shadow: 0 0 0 3px #428af4, 0 0 8px #000000 !important;
    }

    &.truncate {
      :global(textarea.input-element) {
        resize: vertical;
        min-height: 5em;
      }
    }
  }
</style>
