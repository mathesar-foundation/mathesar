<script lang="ts">
  import { onMount } from 'svelte';

  import focusTrap from '@mathesar-component-library-dir/common/actions/focusTrap';
  import {
    blurElement,
    focusElement,
  } from '@mathesar-component-library-dir/common/utils';
  import {
    makeStyleStringFromCssVariables,
    mergeStyleStrings,
  } from '@mathesar-component-library-dir/common/utils/styleUtils';
  import type { CssVariablesObj } from '@mathesar-component-library-dir/types';

  import { setNewMenuControllerInContext } from './MenuController';

  const controller = setNewMenuControllerInContext();
  const { hasControlColumn, hasIconColumn } = controller;

  export let style: string | undefined = undefined;
  export let iconWidth = '1em';
  export let controlWidth = '1em';
  export let cssVariables: CssVariablesObj | undefined = undefined;

  /**
   * When provided, the menu traps focus and provides keyboard navigation.
   */
  export let modal: { close: () => void } | undefined = undefined;

  let menuElement: HTMLElement;

  $: styleStringFromCssVariables = cssVariables
    ? makeStyleStringFromCssVariables(cssVariables)
    : '';
  $: styleString = mergeStyleStrings(
    makeStyleStringFromCssVariables({
      '--Menu__icon-width': iconWidth,
      '--Menu__control-width': controlWidth,
    }),
    styleStringFromCssVariables,
    style,
  );

  function handleMouseMove(e: MouseEvent) {
    const target = e.target as HTMLElement;
    const item = target.closest('[data-menu-item-focusable]');
    if (!item) return;
    focusElement(item);
  }

  function handleMouseLeave() {
    blurElement(document.activeElement);
  }

  function moveSelectionByOffset(offset: number) {
    const elements = [
      ...menuElement.querySelectorAll('[data-menu-item-focusable]'),
    ];

    const targetIndex = (() => {
      const focusedElement = document.activeElement;
      const currentIndex = elements.findIndex((e) => e === focusedElement);
      if (currentIndex === -1) return 0;
      const count = elements.length;
      return (((currentIndex + offset) % count) + count) % count;
    })();

    focusElement(elements.at(targetIndex));
  }

  function handleKeydown(e: KeyboardEvent) {
    let handled = true;
    switch (e.key) {
      case 'Escape':
        modal?.close();
        break;
      case 'ArrowUp':
        moveSelectionByOffset(-1);
        break;
      case 'ArrowDown':
        moveSelectionByOffset(1);
        break;
      default:
        handled = false;
    }
    if (handled) {
      e.stopPropagation();
      e.preventDefault();
    }
  }

  onMount(() => {
    if (!modal) return () => {};

    window.addEventListener('keydown', handleKeydown, { capture: true });
    return () => {
      window.removeEventListener('keydown', handleKeydown, { capture: true });
    };
  });
</script>

{#if modal}
  <div
    class="menu"
    role="menu"
    class:has-icon={$hasIconColumn}
    class:has-control={$hasControlColumn}
    class:menu-modal={modal}
    style={styleString}
    on:mousemove={handleMouseMove}
    on:mouseleave={handleMouseLeave}
    use:focusTrap={{ autoFocus: false }}
    bind:this={menuElement}
  >
    <slot />
  </div>
{:else}
  <div
    class="menu"
    role="menu"
    class:has-icon={$hasIconColumn}
    class:has-control={$hasControlColumn}
    style={styleString}
  >
    <slot />
  </div>
{/if}
