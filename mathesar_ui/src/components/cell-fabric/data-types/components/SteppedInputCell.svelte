<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  import {
    compareWholeValues,
    getValueComparisonOutcome,
    splitMatchParts,
  } from '@mathesar-component-library';
  import CellValue from '@mathesar/components/CellValue.svelte';
  import CellWrapper from './CellWrapper.svelte';
  import type {
    CellTypeProps,
    HorizontalAlignment,
    CellValueFormatter,
  } from './typeDefinitions';

  const dispatch = createEventDispatcher();

  type Value = $$Generic;
  type Props = CellTypeProps<Value>;

  export let isActive: Props['isActive'];
  export let isSelectedInRange: Props['isSelectedInRange'];
  export let value: Props['value'];
  export let disabled: Props['disabled'];
  export let multiLineTruncate = false;
  export let formatValue: CellValueFormatter<Value> | undefined = undefined;
  export let horizontalAlignment: HorizontalAlignment | undefined = undefined;
  export let searchValue: unknown | undefined = undefined;
  export let isIndependentOfSheet = false;
  export let highlightSubstringMatches = true;

  let cellRef: HTMLElement;
  let isEditMode = false;

  $: formattedValue = formatValue?.(value) ?? value;
  $: matchParts = (() => {
    if (
      !highlightSubstringMatches ||
      typeof value !== 'string' ||
      typeof searchValue !== 'string'
    ) {
      return undefined;
    }
    return splitMatchParts(value, searchValue);
  })();
  $: valueComparisonOutcome = (() => {
    if (matchParts) {
      return getValueComparisonOutcome(matchParts);
    }
    const formatter = (v: Value | null | undefined) =>
      v === undefined || v === null ? '' : formatValue?.(v) ?? '';
    return compareWholeValues(searchValue, value, formatter);
  })();

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
        // Preventing default behaviour here. Interesting problem: If this is
        // not prevented, the textarea gets a new line break. Needs more digging
        // down.
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

  function handleMouseDown() {
    if (!isActive) {
      dispatch('activate');
    }
  }
</script>

<CellWrapper
  {isActive}
  {isSelectedInRange}
  {disabled}
  bind:element={cellRef}
  on:dblclick={setModeToEdit}
  on:keydown={handleKeyDown}
  on:mousedown={handleMouseDown}
  on:mouseenter
  mode={isEditMode ? 'edit' : 'default'}
  {multiLineTruncate}
  {horizontalAlignment}
  {valueComparisonOutcome}
  {isIndependentOfSheet}
>
  {#if isEditMode}
    <slot {handleInputBlur} {handleInputKeydown} />
  {:else}
    <div
      class="content"
      class:nowrap={!isActive && !isIndependentOfSheet}
      class:truncate={isActive && multiLineTruncate && !isIndependentOfSheet}
    >
      <slot name="content" {value} {formatValue} {matchParts}>
        <CellValue value={formattedValue} {matchParts} />
      </slot>
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
