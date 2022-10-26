<script lang="ts">
  import CellBackground from '@mathesar/systems/table-view/row/CellBackground.svelte';
  import { tick } from 'svelte';
  import type { HorizontalAlignment } from './typeDefinitions';

  export let element: HTMLElement | undefined = undefined;
  export let isActive = false;
  export let isSelectedInRange = false;
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
  class:has-padding={hasPadding}
  bind:this={element}
  on:click
  on:dblclick
  on:mousedown
  on:mouseenter
  on:keydown
  tabindex={-1}
  {...$$restProps}
>
  <CellBackground
    color="rgba(14, 101, 235, 0.1)"
    when={isSelectedInRange && mode !== 'edit'}
  />
  <slot />
</div>

<style lang="scss">
  .cell-wrapper {
    width: 100%;
    overflow: hidden;
    position: relative;
    min-height: var(--cell-height);
    display: flex;
    flex-direction: column;

    &.has-padding {
      padding: var(--cell-padding);
    }

    &.h-align-right {
      text-align: right;
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
