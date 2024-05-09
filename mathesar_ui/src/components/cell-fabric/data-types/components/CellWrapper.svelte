<script lang="ts">
  import { tick } from 'svelte';

  import CellBackground from '@mathesar/components/CellBackground.svelte';
  import type { ValueComparisonOutcome } from '@mathesar-component-library/types';

  import type { HorizontalAlignment } from './typeDefinitions';

  export let element: HTMLElement | undefined = undefined;
  export let isActive = false;
  export let isSelectedInRange = false;
  export let disabled = false;
  export let mode: 'edit' | 'default' = 'default';
  export let multiLineTruncate = false;
  export let hasPadding = true;
  export let valueComparisonOutcome: ValueComparisonOutcome | undefined =
    undefined;
  export let isIndependentOfSheet = false;

  /**
   * This only affects the alignment of the displayed value while in
   * select-mode. It does not affect the alignment of the value within an input
   * during edit mode -- that alignment is controlled by the specific cell input
   * component (e.g. `NumberCellInput`) because the input is also used in other
   * places (e.g. default values and filter conditions).
   */
  export let horizontalAlignment: HorizontalAlignment = 'left';

  let isFocused = false;

  function shouldAutoFocus(
    _isActive: boolean,
    _mode: 'edit' | 'default',
  ): boolean {
    if (!_isActive) {
      // Don't auto-focus inactive cells
      return false;
    }
    if (_mode === 'edit') {
      // Don't auto-focus cells in edit mode
      return false;
    }
    if (!element) {
      // Can't focus if we haven't mounted an element yet
      return false;
    }
    if (element.contains(document.activeElement)) {
      // Don't auto-focus if the cell contains another element that is already
      // focused (e.g. an input).
      return false;
    }
    return true;
  }

  async function handleStateChange(
    _isActive: boolean,
    _mode: 'edit' | 'default',
  ) {
    await tick();
    if (shouldAutoFocus(_isActive, _mode)) {
      element?.focus();
    }
  }
  $: void handleStateChange(isActive, mode);

  function handleFocus() {
    isFocused = true;
    // Note: you might think we ought to automatically activate the cell at this
    // point to ensure that we don't have any cells which are focused but not
    // active. I tried this and it caused bugs with selecting columns and rows
    // via header cells. I didn't want to spend time tracking them down because
    // we are planning to refactor the cell selection logic soon anyway. It
    // doesn't _seem_ like we have any code which focuses the cell without
    // activating it, but it would be nice to eventually build a better
    // guarantee into the codebase which prevents cells from being focused
    // without being activated.
  }

  function handleBlur() {
    isFocused = false;
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
</script>

<div
  class="cell-wrapper"
  class:is-active={isActive}
  class:is-focused={isFocused}
  class:disabled
  class:is-edit-mode={mode === 'edit'}
  class:truncate={multiLineTruncate && !isIndependentOfSheet}
  class:h-align-right={horizontalAlignment === 'right' && !isIndependentOfSheet}
  class:has-padding={hasPadding && !isIndependentOfSheet}
  class:exact-match={valueComparisonOutcome === 'exactMatch'}
  class:substring-match={valueComparisonOutcome === 'substringMatch'}
  class:no-match={valueComparisonOutcome === 'noMatch'}
  bind:this={element}
  on:click
  on:dblclick
  on:mousedown
  on:mouseenter
  on:keydown
  on:copy={handleCopy}
  on:focus={handleFocus}
  on:blur={handleBlur}
  tabindex={-1}
  {...$$restProps}
>
  {#if mode !== 'edit'}
    <CellBackground color="rgba(14, 101, 235, 0.1)" when={isSelectedInRange} />
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

    &.is-active {
      box-shadow: 0 0 0 2px var(--slate-300);
      border-radius: 2px;

      &.is-focused {
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
