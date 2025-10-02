<script lang="ts">
  import { first } from 'iter-tools';
  import { onMount, tick } from 'svelte';

  import { DelayedStore } from '@mathesar-component-library-dir/common/utils/DelayedStore';
  import { focusElement } from '@mathesar-component-library-dir/common/utils/domUtils';
  import AttachableDropdown from '@mathesar-component-library-dir/dropdown/AttachableDropdown.svelte';
  import type { IconProps } from '@mathesar-component-library-dir/icon/IconTypes';
  import StringOrComponent from '@mathesar-component-library-dir/string-or-component/StringOrComponent.svelte';
  import type { ComponentAndProps } from '@mathesar-component-library-dir/types';

  import { menuControllerContext } from './MenuController';
  import MenuItemContents from './MenuItemContents.svelte';

  const menu = menuControllerContext.getOrError();

  export let label: string | ComponentAndProps | undefined = undefined;
  export let icon: IconProps | undefined = undefined;
  export let closeRoot: () => void = () => {};

  let trigger: HTMLButtonElement;
  let subMenu: HTMLDivElement;

  /**
   * This is a DelayedStore for usability purposes.
   *
   * Example:
   *
   * 1. Open a parent menu with 4 entries, the first of which is a sub-menu.
   * 2. Open the sub-menu via hover. The sub-menu contains several entries.
   * 3. You move your mouse _diagonally_ down toward the lower entries in the
   *    sub-menu. In doing so, your mouse crosses over the lower entries in the
   *    parent menu. You want the sub-menu to remain open even though you're
   *    moving your mouse over other entries in the parent (which would normally
   *    close the sub-menu). As long as you move quickly, the sub-menu should
   *    stay open.
   */
  const isOpen = new DelayedStore(false, 200);

  async function openActively() {
    isOpen.setImmediately(true);
    await tick();
    const e = first(subMenu.querySelectorAll('[data-menu-item-focusable]'));
    await tick();
    focusElement(e);
  }

  function openPassively() {
    isOpen.setAfterDelay(true);
  }

  function closeActively() {
    isOpen.setImmediately(false);
    trigger.focus();
  }

  function closePassively() {
    isOpen.setAfterDelay(false);
  }

  function handleClick(e: MouseEvent) {
    void openActively();
    e.stopPropagation(); // So that we don't close the parent menu
  }

  onMount(() => {
    menu.hasSubMenuOpen.registerInput(isOpen);
    menu.subMenuControllers.set(trigger, {
      openActively: () => {
        void openActively();
      },
      openPassively,
      closeActively,
      closePassively,
    });
  });
</script>

<button
  on:click={handleClick}
  role="menuitem"
  data-menu-item-focusable
  data-menu-item-sub-menu
  class="menu-item menu-item-button"
  class:opened={$isOpen}
  bind:this={trigger}
  on:mouseenter={openPassively}
  on:mouseleave={closePassively}
>
  <MenuItemContents {icon} hasSubMenu>
    <slot name="label">
      {#if label}
        <StringOrComponent arg={label} />
      {/if}
    </slot>
  </MenuItemContents>
</button>

<AttachableDropdown
  isOpen={$isOpen}
  {trigger}
  placements={['right-start', 'left-start', 'bottom', 'top']}
  on:click={closeRoot}
  on:mouseenter={() => {
    isOpen.setImmediately(true);
  }}
>
  <div class="sub-menu" bind:this={subMenu}>
    <slot close={closeActively} />
  </div>
</AttachableDropdown>
