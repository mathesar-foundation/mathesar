<script lang="ts">
  import type { DataFormManager } from '../DataFormManager';

  export let dataFormManager: DataFormManager;
  export let elementId: string;

  $: ({ selectedElement } = dataFormManager);
  $: isSelected = elementId === $selectedElement;

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
    e.stopPropagation();
    dataFormManager.selectElement(elementId);
  }
</script>

<div
  tabindex="0"
  bind:this={thisDomElement}
  data-form-selectable
  class:selected={$selectedElement === elementId}
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
    <div>
      <slot {isSelected} />
    </div>
    {#if isSelected && $$slots.footer}
      <div class="footer">
        <slot name="footer" />
      </div>
    {/if}
  </div>
</div>

<style lang="scss">
  [data-form-selectable] {
    position: relative;

    > .content {
      transition: background 0.3s;
      border: 2px solid transparent;
      border-radius: var(--sm4);
      overflow: hidden;
    }

    &.selected > .content {
      border: 2px solid var(--accent-500);
    }

    &.hover > .content {
      background-color: var(--accent-100);
    }
  }

  .footer {
    border-top: 1px solid var(--accent-300);
    display: flex;
    padding: var(--sm4) var(--sm2);
  }
  .header {
    position: absolute;
    display: flex;
    width: 100%;
    padding: 0 var(--sm2);
    z-index: var(--dropdown-z-index);
    top: 0;
    transform: translate(0, -50%);
  }
</style>
