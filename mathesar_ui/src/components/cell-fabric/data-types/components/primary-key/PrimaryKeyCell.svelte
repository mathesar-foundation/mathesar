<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { _ } from 'svelte-i18n';

  import CellWrapper from '@mathesar/components/cell-fabric/data-types/components/CellWrapper.svelte';
  import type { PrimaryKeyCellProps } from '@mathesar/components/cell-fabric/data-types/components/typeDefinitions';
  import Default from '@mathesar/components/Default.svelte';
  import { iconLinkToRecordPage } from '@mathesar/icons';
  import { storeToGetRecordPageUrl } from '@mathesar/stores/storeBasedUrls';
  import { Icon } from '@mathesar-component-library';

  type $$Props = PrimaryKeyCellProps;

  const dispatch = createEventDispatcher();

  export let isActive: $$Props['isActive'];
  export let isSelectedInRange: $$Props['isSelectedInRange'];
  export let value: $$Props['value'] = undefined;
  export let disabled: $$Props['disabled'];
  export let tableId: $$Props['tableId'];
  export let isIndependentOfSheet: $$Props['isIndependentOfSheet'];
  export let canViewLinkedEntities: $$Props['canViewLinkedEntities'];

  $: href = $storeToGetRecordPageUrl({ tableId, recordId: value });

  function handleContextMenu(e: MouseEvent) {
    // This is so users can right-click on the link without triggering the
    // Mathesar context menu or cell selection.
    e.stopPropagation();
  }

  function handleValueMouseDown() {
    dispatch('activate');
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
  {isSelectedInRange}
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
    <span class="value" on:mousedown={handleValueMouseDown}>
      {#if value === undefined}
        <Default />
      {:else}
        {value}
      {/if}
    </span>
    {#if canViewLinkedEntities}
      <a
        {href}
        class="link"
        title={$_('go_to_record_with_value', { values: { value } })}
        on:contextmenu={handleContextMenu}
      >
        <Icon {...iconLinkToRecordPage} />
      </a>
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
  .link {
    display: flex;
    align-items: center;
    padding: 0 var(--cell-padding);
    color: var(--color-gray-dark);
  }
  .link:hover {
    color: var(--color-text);
  }
</style>
