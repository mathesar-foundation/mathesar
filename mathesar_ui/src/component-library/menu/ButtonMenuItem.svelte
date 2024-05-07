<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  import type { IconProps } from '@mathesar-component-library-dir/icon/IconTypes';

  import MenuItemContents from './MenuItemContents.svelte';
  import MenuItemWrapper from './MenuItemWrapper.svelte';

  const dispatch = createEventDispatcher();

  export let label: string | undefined = undefined;
  export let icon: IconProps | undefined = undefined;
  export let disabled = false;
  /** Visually indicates that the action is destructive */
  export let danger = false;
  export let hasNotificationDot = false;

  function handleClick() {
    if (disabled) {
      return;
    }
    dispatch('click');
  }
</script>

<MenuItemWrapper
  tag="button"
  class="menu-item-button"
  on:click={handleClick}
  {disabled}
  {danger}
  {...$$restProps}
>
  <MenuItemContents {icon} {hasNotificationDot}>
    {#if label}
      {label}
    {:else}
      <slot />
    {/if}
  </MenuItemContents>
</MenuItemWrapper>
