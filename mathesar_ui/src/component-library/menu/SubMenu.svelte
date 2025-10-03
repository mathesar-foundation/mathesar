<script lang="ts">
  import { onMount } from 'svelte';
  import { readable } from 'svelte/store';

  import AttachableDropdown from '@mathesar-component-library-dir/dropdown/AttachableDropdown.svelte';
  import type { IconProps } from '@mathesar-component-library-dir/icon/IconTypes';
  import StringOrComponent from '@mathesar-component-library-dir/string-or-component/StringOrComponent.svelte';
  import type { ComponentAndProps } from '@mathesar-component-library-dir/types';

  import {
    type SubMenuController,
    menuControllerContext,
  } from './MenuController';
  import MenuItemContents from './MenuItemContents.svelte';

  const menu = menuControllerContext.getOrError();

  export let label: string | ComponentAndProps | undefined = undefined;
  export let icon: IconProps | undefined = undefined;
  export let closeRoot: () => void = () => {};

  let trigger: HTMLButtonElement;
  let controller: SubMenuController | undefined;

  $: isOpen = controller?.isOpen ?? readable(false);

  function handleClick(e: Event) {
    controller?.open();
    e.stopPropagation(); // To avoid closing the parent menu
  }

  onMount(() => {
    controller = menu.registerSubMenu(trigger);
    return () => {
      menu.unRegisterSubMenu(trigger);
    };
  });
</script>

<button
  role="menuitem"
  data-menu-item-focusable
  data-menu-item-sub-menu
  class="menu-item menu-item-button"
  class:opened={$isOpen}
  bind:this={trigger}
  on:click={handleClick}
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
  on:mouseenter={() => controller?.handleMouseEnterContent()}
  matchTriggerWidthPxUpTo={10}
>
  <div class="sub-menu">
    <slot close={() => controller?.close()} />
  </div>
</AttachableDropdown>
