<script lang="ts">
  import { sortableItem } from '@mathesar/components/sortable/sortable';
  import { ensureReadable } from '@mathesar-component-library';

  import {
    type DataFormManager,
    EditableDataFormManager,
    type SelectableElement,
  } from '../data-form-utilities/DataFormManager';

  export let dataFormManager: DataFormManager;
  export let element: SelectableElement;

  $: selectedElement = ensureReadable(
    dataFormManager instanceof EditableDataFormManager
      ? dataFormManager.selectedElement
      : undefined,
  );
  $: isSelected = (() => {
    if ($selectedElement?.type === 'field' && element.type === 'field') {
      return $selectedElement.field === element.field;
    }
    return $selectedElement?.type === element.type;
  })();

  function onClick(e: Event) {
    if (dataFormManager instanceof EditableDataFormManager) {
      e.stopPropagation();
      dataFormManager.selectElement(element);
    }
  }
</script>

<div
  tabindex="0"
  data-form-selectable
  class:can-select={dataFormManager instanceof EditableDataFormManager}
  class:selected={isSelected}
  class:is-header-present={$$slots.header}
  on:click={onClick}
  use:sortableItem
>
  {#if isSelected && $$slots.header}
    <div class="header">
      <slot name="header" />
    </div>
  {/if}
  <div class="content">
    <slot {isSelected} />
  </div>
  {#if isSelected && $$slots.footer}
    <div class="footer">
      <slot name="footer" />
    </div>
  {/if}
  {#if isSelected && $$slots.left}
    <div class="left">
      <slot name="left" />
    </div>
  {/if}
</div>

<style lang="scss">
  [data-form-selectable] {
    position: relative;

    > .content {
      border: 2px solid transparent;
      border-radius: var(--sm4);
      overflow: hidden;
      padding: var(--data_forms__selectable-element-padding);
    }

    &.selected > .content {
      border: 2px solid var(--accent-500);
    }
  }

  :global(
      [data-form-selectable].can-select:hover:not(
          :has([data-form-selectable]:hover)
        )
        > .content
    ) {
    background-color: var(--accent-100);
  }

  .header,
  .footer,
  .left {
    position: absolute;
    display: flex;
    padding: 0 var(--sm2);
    z-index: var(--data_forms__z-index__field-header);
    width: fit-content;
    max-width: 100%;
  }

  .header {
    top: 0;
    transform: translate(0, -60%);
    right: 0;
  }
  .footer {
    bottom: 0;
    transform: translate(-50%, 50%);
    left: 50%;
  }
  .left {
    bottom: 50%;
    transform: translate(-50%, 50%);
    left: 0;
  }
</style>
