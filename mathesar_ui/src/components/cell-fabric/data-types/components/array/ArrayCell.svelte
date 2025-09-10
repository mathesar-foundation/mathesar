<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  import CellValue from '@mathesar/components/CellValue.svelte';
  import Null from '@mathesar/components/Null.svelte';
  import { labeledCount } from '@mathesar/utils/languageUtils';
  import { Truncate, isDefinedNonNullable } from '@mathesar-component-library';

  import CellWrapper from '../CellWrapper.svelte';
  import type { ArrayCellProps } from '../typeDefinitions';

  type $$Props = ArrayCellProps;

  const dispatch = createEventDispatcher();

  export let isActive: $$Props['isActive'];
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
</script>

<CellWrapper
  {isActive}
  {disabled}
  {isIndependentOfSheet}
  on:mouseenter
  on:keydown={handleWrapperKeyDown}
>
  <CellValue {value}>
    {#if isDefinedNonNullable(value)}
      {#if isIndependentOfSheet}
        <div class="count">{labeledCount(value, 'values')}</div>
      {/if}
      <div
        class="values"
        class:display-all={isActive || isIndependentOfSheet}
        class:independent={isIndependentOfSheet}
      >
        {#each value as entry}
          <span class="token">
            {#if entry === null}
              <Null />
            {:else}
              <Truncate>
                {formatElementForDisplay(entry)}
              </Truncate>
            {/if}
          </span>
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

  .token {
    padding: 0 var(--sm3);
    border-radius: var(--border-radius-l);
    white-space: nowrap;
    color: var(--text-primary);
    background-color: var(--color-bg-token);
    border: 1px solid var(--color-border-token);
  }

  .values {
    display: flex;
    flex-direction: row;
    gap: var(--sm4);
    overflow: hidden;

    &.independent {
      flex-wrap: wrap;
    }
    &:not(.independent) {
      flex-wrap: nowrap;
    }
  }
</style>
