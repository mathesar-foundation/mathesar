<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { isDefinedNonNullable, Chip } from '@mathesar-component-library';
  import CellValue from '@mathesar/components/CellValue.svelte';
  import Null from '@mathesar/components/Null.svelte';
  import CellWrapper from '../CellWrapper.svelte';
  import type { ArrayCellProps } from '../typeDefinitions';

  type $$Props = ArrayCellProps;

  const dispatch = createEventDispatcher();

  export let isActive: $$Props['isActive'];
  export let isSelectedInRange: $$Props['isSelectedInRange'];
  export let value: $$Props['value'] = undefined;
  export let disabled: $$Props['disabled'];
  export let isIndependentOfSheet: $$Props['isIndependentOfSheet'];
  export let formatElementForDisplay: $$Props['formatElementForDisplay'];

  function handleWrapperKeyDown(e: KeyboardEvent) {
    switch (e.key) {
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
</script>

<CellWrapper
  {isActive}
  {isSelectedInRange}
  {disabled}
  {isIndependentOfSheet}
  on:mouseenter
  on:keydown={handleWrapperKeyDown}
  on:mousedown={handleMouseDown}
>
  <CellValue {value}>
    {#if isDefinedNonNullable(value)}
      {#if isIndependentOfSheet}
        <div class="count">{value.length} value(s)</div>
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
</CellWrapper>

<style lang="scss">
  .count {
    font-weight: 500;
    margin-bottom: 0.8rem;
  }
</style>
