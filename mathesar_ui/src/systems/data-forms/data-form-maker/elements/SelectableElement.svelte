<script lang="ts">
  import { ensureReadable } from '@mathesar-component-library';

  import {
    type DataFormManager,
    EditableDataFormManager,
    type SelectedElement,
  } from '../../data-form-utilities/DataFormManager';

  export let dataFormManager: DataFormManager;
  export let element: SelectedElement;

  $: selectedElement = ensureReadable(
    dataFormManager instanceof EditableDataFormManager
      ? dataFormManager.selectedElement
      : undefined,
  );

  $: isSelected = element === $selectedElement;

  let isHovered = false;
  let thisDomElement: HTMLElement;

  function onHover(e: MouseEvent) {
    const { target } = e;
    if (target instanceof HTMLElement) {
      if (target.closest('[data-form-selectable]') === thisDomElement) {
        isHovered = true;
        return;
      }
    }
    isHovered = false;
  }

  function onHoverAway(e: MouseEvent) {
    isHovered = false;
  }

  function onClick(e: Event) {
    if (dataFormManager instanceof EditableDataFormManager) {
      e.stopPropagation();
      dataFormManager.selectElement(element);
    }
  }
</script>

<div
  tabindex="0"
  bind:this={thisDomElement}
  data-form-selectable
  class:selected={isSelected}
  class:hover={isHovered}
  class:is-header-present={$$slots.header}
  on:click={onClick}
  on:mouseenter={onHover}
  on:mousemove={onHover}
  on:mouseleave={onHoverAway}
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

    &.hover > .content {
      background-color: var(--accent-100);
    }
  }

  .header,
  .footer {
    position: absolute;
    display: flex;
    padding: 0 var(--sm2);
    z-index: var(--z-index__data_forms__field-header);
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
</style>
