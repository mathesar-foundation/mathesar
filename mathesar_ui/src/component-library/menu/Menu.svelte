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

  import {
    type ModalMenuOptions,
    type SubMenuController,
    makeMenuController,
    menuControllerContext,
  } from './MenuController';

  const menuController = makeMenuController();
  menuControllerContext.set(menuController);
  const { hasControlColumn, hasIconColumn, hasSubMenu, hasSubMenuOpen } =
    menuController;

  export let style: string | undefined = undefined;
  export let iconWidth = '1em';
  export let controlWidth = '1em';
  export let cssVariables: CssVariablesObj | undefined = undefined;

  /**
   * When provided, the menu does special "modal" things like trapping focus and
   * providing keyboard navigation.
   */
  export let modal: ModalMenuOptions | undefined = undefined;
  export let isSubMenu = false;

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

  function getSubMenuFromEventTarget({
    target,
  }: Event): SubMenuController | undefined {
    if (!target) return undefined;
    return menuController.subMenuControllers.get(target);
  }

  function getSubMenu(element: object): SubMenuController | undefined {
    return menuController.subMenuControllers.get(element);
  }

  function handleKeydown(e: KeyboardEvent) {
    if ($hasSubMenuOpen) return;

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
      case 'ArrowRight':
        getSubMenuFromEventTarget(e)?.openActively();
        break;
      case 'ArrowLeft':
        if (!isSubMenu) return;
        modal?.close();
        break;
      default:
        return;
    }
    e.stopPropagation();
    e.preventDefault();
  }

  function handleFocusIn(e: Event) {
    // Any time an element inside the menu is focused, we close all the
    // sub-menus which are _not_ the element being focused. We close them
    // "passively" so that there is a small delay to account for the user
    // quickly moving the mouse to an entry within a sub-menu.
    const subMenus = menuElement.querySelectorAll('[data-menu-item-sub-menu]');
    for (const subMenuElement of subMenus) {
      if (subMenuElement === e.target) continue;
      getSubMenu(subMenuElement)?.closePassively();
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
    class:has-sub-menu={$hasSubMenu}
    class:menu-modal={modal}
    style={styleString}
    on:mousemove={handleMouseMove}
    on:mouseleave={handleMouseLeave}
    on:focusin={handleFocusIn}
    use:focusTrap={{
      autoFocus: false,
      autoRestore: modal.restoreFocusOnClose ?? true,
    }}
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
    class:has-sub-menu={$hasSubMenu}
    style={styleString}
  >
    <slot />
  </div>
{/if}
