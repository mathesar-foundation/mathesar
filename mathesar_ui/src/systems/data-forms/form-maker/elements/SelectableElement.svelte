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

  $: editableDataFormManager =
    dataFormManager instanceof EditableDataFormManager
      ? dataFormManager
      : undefined;
  $: selectedElement = ensureReadable(
    editableDataFormManager
      ? editableDataFormManager.selectedElement
      : undefined,
  );

  $: selectionOpts = (() => {
    if ($selectedElement?.type === 'field' && element.type === 'field') {
      const isImmediateChildSelected =
        $selectedElement.field.container.parent === element.field;
      const isAnyChildSelected = (() => {
        let current = $selectedElement.field.container.parent;
        while ('container' in current) {
          if (current === element.field) {
            return true;
          }
          current = current.container.parent;
        }
        return false;
      })();
      return {
        isSelected: $selectedElement.field === element.field,
        isImmediateChildSelected,
        isAnyChildSelected,
      };
    }
    return {
      isSelected: $selectedElement?.type === element.type,
      isImmediateChildSelected: false,
      isAnyChildSelected: false,
    };
  })();

  $: ({ isSelected, isImmediateChildSelected, isAnyChildSelected } =
    selectionOpts);

  function activate(e: Event) {
    if (editableDataFormManager) {
      e.stopPropagation();
      editableDataFormManager.selectElement(element);
    }
  }
</script>

<div
  data-form-selectable
  class:can-select={!!editableDataFormManager}
  class:selected={isSelected}
  class:immediate-child-selected={isImmediateChildSelected}
  class:some-child-selected={isAnyChildSelected}
  on:click={activate}
  on:focus={activate}
  on:focusin={activate}
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
      border-color: transparent;
      border-style: solid;
      border-width: 0;
      border-radius: var(--sm4);
      overflow: hidden;
      padding: var(--df__internal__selectable-elem-padding);
    }

    &.can-select > .content {
      border-width: 2px;
    }

    &.selected > .content {
      border-color: var(--df__internal__selected-element-border-color);
    }

    &.some-child-selected {
      z-index: var(--df__internal__z-index__field-with-some-selected-child);
    }

    &.some-child-selected:not(.immediate-child-selected) > .content {
      outline: 1px dotted
        var(--df__internal__some-child-selected-border-color, transparent);
    }

    &.some-child-selected.immediate-child-selected > .content {
      border-style: dashed;
      outline: 1px dashed
        var(--df__internal__immediate-child-selected-border-color, transparent);
    }
  }

  :global(
      [data-form-selectable].can-select:not(.selected):hover:not(
          :has([data-form-selectable]:hover)
        )
        > .content
    ) {
    background-color: var(--df__internal__selected-element-bg);
  }

  // background is set because fields can overlap when dragging to rearrange,
  // and it looks awkward without a background.
  :global([data-form-selectable][data-sortable-item].is-dragging) {
    background: var(--color-bg-raised-2);
    z-index: var(--df__internal__z-index__field-being-dragged);
  }

  .header,
  .footer,
  .left {
    position: absolute;
    display: flex;
    padding: 0 var(--sm2);
    z-index: var(--df__internal__z-index__field-outer-controls);
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
