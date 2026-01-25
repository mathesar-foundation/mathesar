<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  import CellValue from '@mathesar/components/CellValue.svelte';
  import {
    Truncate,
    compareWholeValues,
    getValueComparisonOutcome,
    splitMatchParts,
  } from '@mathesar-component-library';

  import CellWrapper from './CellWrapper.svelte';
  import type {
    CellTypeProps,
    CellValueFormatter,
    HorizontalAlignment,
  } from './typeDefinitions';

  const dispatch = createEventDispatcher();

  type Value = $$Generic;
  type Props = CellTypeProps<Value>;

  export let isActive: Props['isActive'];
  export let value: Props['value'];
  export let setValue: (newValue: Value | null | undefined) => void;
  export let disabled: Props['disabled'];
  export let multiLineTruncate = false;
  export let formatValue: CellValueFormatter<Value> | undefined = undefined;
  export let horizontalAlignment: HorizontalAlignment | undefined = undefined;
  export let searchValue: unknown | undefined = undefined;
  export let isIndependentOfSheet = false;
  export let showTruncationPopover = false;
  export let highlightSubstringMatches = true;
  export let useTabularNumbers = false;

  let cellRef: HTMLElement;
  let isEditMode = false;
  /** Stored ephemerally while the user is editing the cell */
  let valueInEditMode: Value | undefined | null = undefined;

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

  function enterEditMode() {
    if (disabled) return; // Can't edit disabled cells
    isEditMode = true;
    valueInEditMode = value;
  }

  function exitEditMode(saveStrategy: 'saveChanges' | 'discardChanges') {
    if (!isEditMode) return;
    if (saveStrategy === 'saveChanges' && valueInEditMode !== value) {
      setValue(valueInEditMode);
    }
    isEditMode = false;
    valueInEditMode = undefined;
  }

  function handleKeyDown(e: KeyboardEvent) {
    switch (e.key) {
      case 'Enter':
        if (isEditMode) {
          exitEditMode('saveChanges');
        } else {
          enterEditMode();
        }
        // Preventing default behaviour here. Interesting problem: If this is
        // not prevented, the textarea gets a new line break. Needs more digging
        // down.
        e.preventDefault();
        break;
      case 'Escape':
        exitEditMode('discardChanges');
        break;
      case 'Tab':
        exitEditMode('saveChanges');
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

  function handleInputBlur() {
    exitEditMode('saveChanges');
  }

  function setValueInEditMode(v: Value | null) {
    valueInEditMode = v;
  }
</script>

<CellWrapper
  {isActive}
  {disabled}
  bind:element={cellRef}
  on:dblclick={enterEditMode}
  on:keydown={handleKeyDown}
  on:mouseenter
  mode={isEditMode ? 'edit' : 'default'}
  {useTabularNumbers}
  {multiLineTruncate}
  {horizontalAlignment}
  {valueComparisonOutcome}
  {isIndependentOfSheet}
>
  {#if isEditMode}
    <slot {handleInputBlur} {setValueInEditMode} />
  {:else}
    <div
      class="content"
      class:nowrap={!isActive && !isIndependentOfSheet}
      class:truncate={isActive && multiLineTruncate && !isIndependentOfSheet}
    >
      <Truncate
        lines={isActive && multiLineTruncate ? 2 : 1}
        passthrough={!showTruncationPopover}
      >
        <slot name="content" {value} {formatValue} {matchParts}>
          <CellValue value={formattedValue} {matchParts} />
        </slot>
      </Truncate>
    </div>
  {/if}
</CellWrapper>

<style lang="scss">
  .content {
    overflow: hidden;
    position: relative;
    text-overflow: ellipsis;
    text-align: inherit;

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
