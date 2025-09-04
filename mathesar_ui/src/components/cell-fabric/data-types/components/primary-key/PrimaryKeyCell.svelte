<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  import CellWrapper from '@mathesar/components/cell-fabric/data-types/components/CellWrapper.svelte';
  import type { PrimaryKeyCellProps } from '@mathesar/components/cell-fabric/data-types/components/typeDefinitions';
  import Default from '@mathesar/components/Default.svelte';
  import RecordHyperlink from '@mathesar/components/RecordHyperlink.svelte';
  import { iconModalRecordView } from '@mathesar/icons';
  import { Icon } from '@mathesar-component-library';

  type $$Props = PrimaryKeyCellProps;

  const dispatch = createEventDispatcher();

  export let isActive: $$Props['isActive'];
  export let value: $$Props['value'] = undefined;
  export let disabled: $$Props['disabled'];
  export let tableId: $$Props['tableId'];
  export let isIndependentOfSheet: $$Props['isIndependentOfSheet'];
  export let canViewLinkedEntities: $$Props['canViewLinkedEntities'];

  function handleLinkContextMenu(e: MouseEvent) {
    // This is so users can right-click on the link without triggering the
    // Mathesar context menu or cell selection.
    e.stopPropagation();
  }

  function handleKeyDown(e: KeyboardEvent) {
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
  on:keydown={handleKeyDown}
  hasPadding={false}
>
  <div
    class="primary-key-cell"
    class:is-independent-of-sheet={isIndependentOfSheet}
  >
    <span class="value">
      {#if value === undefined}
        <Default />
      {:else}
        {value}
      {/if}
    </span>
    {#if canViewLinkedEntities}
      <RecordHyperlink
        {tableId}
        recordId={value}
        on:contextmenu={handleLinkContextMenu}
      >
        <span class="link-icon">
          <Icon {...iconModalRecordView} />
        </span>
      </RecordHyperlink>
    {/if}
  </div>
</CellWrapper>

<style>
  .primary-key-cell:not(.is-independent-of-sheet) {
    position: absolute;
  }
  .primary-key-cell {
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: grid;
    grid-template: auto / 1fr auto;
  }
  .value {
    display: flex;
    align-items: center;
    padding-left: var(--cell-padding);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .link-icon {
    padding: 0 var(--cell-padding);
    color: var(--color-gray-dark);
  }
  .link-icon:hover {
    color: var(--color-text);
  }
</style>
