<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  import CellBackground from '@mathesar/components/CellBackground.svelte';
  import type { ValueComparisonOutcome } from '@mathesar-component-library/types';

  import type { HorizontalAlignment } from './typeDefinitions';

  const dispatch = createEventDispatcher();

  export let element: HTMLElement | undefined = undefined;
  export let isActive = false;
  export let disabled = false;
  export let mode: 'edit' | 'default' = 'default';
  export let multiLineTruncate = false;
  export let hasPadding = true;
  export let valueComparisonOutcome: ValueComparisonOutcome | undefined =
    undefined;
  export let isIndependentOfSheet = false;
  export let useTabularNumbers = false;
  /**
   * This only affects the alignment of the displayed value while in
   * select-mode. It does not affect the alignment of the value within an input
   * during edit mode -- that alignment is controlled by the specific cell input
   * component (e.g. `NumberCellInput`) because the input is also used in other
   * places (e.g. default values and filter conditions).
   */
  export let horizontalAlignment: HorizontalAlignment = 'left';

  /**
   * This function exists to ensure that the cell is focused after the user
   * moves from edit mode to default mode via pressing Enter.
   */
  function autoFocus() {
    if (!element) {
      // Can't focus if we haven't mounted an element yet
      return;
    }
    if (!element.contains(document.activeElement)) {
      // Only auto-focus when the cell contains another element that is already
      // focused (e.g. an input). If the user moves from edit mode to default
      // mode via clicking on some UI element outside sheet, then we _don't_
      // want to focus the cell. We want to keep the focus on the other UI
      // element that they clicked.
      return;
    }
    element.focus();
  }

  $: if (mode === 'default') {
    autoFocus();
  }

  function handleCopy(e: ClipboardEvent) {
    if (e.target !== element) {
      // When the user copies text _within_ a cell (e.g. from within an input
      // element) we need to stop propagation so that the copy event doesn't
      // reach the sheet where it is handled by the SheetClipboardHandler to
      // copy _cells_. If we don't stop propagation, the entire cell value will
      // be copied instead of copying only the text within the input that the
      // user selected.
      e.stopPropagation();
    }
  }

  function handleMouseDown(e: MouseEvent) {
    if (mode === 'edit') {
      // In edit mode we want to capture mousedown events and prevent them from
      // propagating to the sheet where mousedown events are used to select
      // cells. Without this call, clicking inside a cell input would cause the
      // cell to exit edit mode.
      e.stopPropagation();
    }
    dispatch('mousedown', e);
  }
</script>

<div
  class="cell-wrapper"
  class:disabled
  class:is-edit-mode={mode === 'edit'}
  class:truncate={multiLineTruncate && !isIndependentOfSheet}
  class:h-align-right={horizontalAlignment === 'right' && !isIndependentOfSheet}
  class:has-padding={hasPadding && !isIndependentOfSheet}
  class:exact-match={valueComparisonOutcome === 'exactMatch'}
  class:substring-match={valueComparisonOutcome === 'substringMatch'}
  class:no-match={valueComparisonOutcome === 'noMatch'}
  class:is-tabular-number={useTabularNumbers}
  data-active-cell={isActive ? '' : undefined}
  bind:this={element}
  on:click
  on:dblclick
  on:mousedown={handleMouseDown}
  on:mouseup
  on:mouseenter
  on:mouseleave
  on:keydown
  on:copy={handleCopy}
  tabindex={-1}
  {...$$restProps}
>
  {#if mode !== 'edit'}
    <CellBackground
      color="var(--cell-background-color)"
      when={valueComparisonOutcome !== 'noMatch'}
    />
  {/if}
  <slot />
</div>

<style lang="scss">
  .cell-wrapper {
    width: 100%;
    overflow: hidden;
    position: relative;
    min-height: var(--cell-height, var(--default-cell-height));
    display: flex;
    flex-direction: column;

    &.has-padding {
      padding: var(--cell-padding);
    }

    &.h-align-right {
      text-align: right;
    }

    &[data-active-cell] {
      box-shadow: 0 0 0 2px var(--gray-300);
      border-radius: 2px;

      &:focus {
        box-shadow: 0 0 0 2px var(--sky-700);
      }
    }

    :global(.input-element) {
      box-shadow: none;
      border: none;
    }

    &.is-edit-mode {
      padding: 0px;
      box-shadow:
        0 0 0 3px var(--sky-700),
        0 0 8px #000000 !important;
    }

    &.truncate {
      :global(textarea.input-element) {
        resize: vertical;
        min-height: 5em;
      }
    }

    &.is-tabular-number {
      font-variant-numeric: tabular-nums;
    }
  }
  .exact-match {
    --Match__highlight-color: transparent;
    --cell-background-color: var(--color-substring-match);
  }
  .substring-match {
    --cell-background-color: var(--color-substring-match-light);
  }
  .no-match {
    text-decoration: line-through;
  }
</style>
