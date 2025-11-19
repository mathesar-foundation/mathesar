<script lang="ts">
  import { onMount } from 'svelte';
  import { focusElement, blurElement, getFirstFocusableAncestor, getFocusableDescendants } from '@mathesar-component-library-dir/common/utils';

  export let menuItems: HTMLElement[];

  let menuElement: HTMLElement;

  function handleMouseMove(e: MouseEvent) {
    const target = e.target as HTMLElement;
    const item = getFirstFocusableAncestor(target);
    if (!item) return;
    focusElement(item);
  }

  function handleMouseLeave() {
    blurElement(document.activeElement);
  }

  function handleKeydown(e: KeyboardEvent) {
    const elements = [...getFocusableDescendants(menuElement)];
    const currentIndex = elements.findIndex(el => el === document.activeElement);

    switch (e.key) {
      case 'ArrowDown':
        focusElement(elements[(currentIndex + 1) % elements.length]);
        break;
      case 'ArrowUp':
        focusElement(elements[(currentIndex - 1 + elements.length) % elements.length]);
        break;
      case 'Escape':
        blurElement(document.activeElement);
        break;
      default:
        return;
    }

    e.preventDefault();
    e.stopPropagation();
  }

  onMount(() => {
    window.addEventListener('keydown', handleKeydown, { capture: true });
    return () => window.removeEventListener('keydown', handleKeydown, { capture: true });
  });
</script>

<div
  class="menu"
  role="menu"
  bind:this={menuElement}
  on:mousemove={handleMouseMove}
  on:mouseleave={handleMouseLeave}
  tabindex="0"
>
  <slot />
</div>
