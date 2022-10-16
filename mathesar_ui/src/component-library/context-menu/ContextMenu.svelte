<script lang="ts">
  import Menu from '@mathesar-component-library-dir/menu/Menu.svelte';
  import popper from '@mathesar-component-library-dir/common/actions/popper';
  import portal from '@mathesar-component-library-dir/common/actions/portal';
  import clickOffBounds from '@mathesar-component-library-dir/common/actions/clickOffBounds';
  import { onMount } from 'svelte';

  /**
   * A reference to the DOM node where we'll attach the contextmenu event
   * listener. Right-clicking anywhere inside this element will open the context
   * menu. If you don't pass an element, we'll use the parent element wherever
   * this component is mounted.
   */
  let customTriggerElement: HTMLElement | undefined = undefined;
  export { customTriggerElement as triggerElement };
  export let closeOnInnerClick = true;

  interface MousePosition {
    x: number;
    y: number;
  }

  let isVisible = false;
  let element: HTMLDivElement | undefined;
  let mousePosition: MousePosition = { x: 0, y: 0 };

  function getVirtualReferenceElement(_mousePosition: MousePosition) {
    const { x, y } = _mousePosition;
    return {
      getBoundingClientRect: () => ({
        width: 0,
        height: 0,
        x,
        y,
        top: y,
        right: x,
        bottom: y,
        left: x,
        toJSON: () => ({ x, y }),
      }),
    };
  }

  function handleContextMenu(event: MouseEvent) {
    event.preventDefault();
    mousePosition = {
      x: event.clientX,
      y: event.clientY,
    };
    isVisible = !isVisible;
  }

  onMount(() => {
    const triggerElement =
      customTriggerElement ?? element?.parentElement ?? undefined;
    if (!triggerElement) {
      return () => {};
    }
    triggerElement.addEventListener('contextmenu', handleContextMenu);
    return () => {
      triggerElement.removeEventListener('contextmenu', handleContextMenu);
    };
  });

  function close() {
    isVisible = false;
  }

  function checkAndCloseOnInnerClick() {
    if (closeOnInnerClick) {
      close();
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape' && isVisible) {
      close();
    }
  }
</script>

<svelte:window on:keydown={handleKeydown} />

<div bind:this={element} class="context-menu-wrapper">
  {#if isVisible}
    <div
      class="context-menu dropdown content"
      use:clickOffBounds={{ callback: close }}
      use:popper={{ reference: getVirtualReferenceElement(mousePosition) }}
      use:portal
      on:click={checkAndCloseOnInnerClick}
    >
      <Menu>
        <slot />
      </Menu>
    </div>
  {/if}
</div>
