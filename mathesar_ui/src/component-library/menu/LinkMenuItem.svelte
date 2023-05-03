<script lang="ts">
  import type { IconProps } from '@mathesar-component-library-dir/icon/IconTypes';
  import MenuItemWrapper from './MenuItemWrapper.svelte';
  import MenuItemContents from './MenuItemContents.svelte';

  export let icon: IconProps | undefined = undefined;
  export let href: string;
  export let hasNotificationDot = false;
  export let disabled = false;

  let classes = '';
  export { classes as class };
</script>

<MenuItemWrapper
  tag="a"
  class="menu-item-link {classes}"
  {href}
  {disabled}
  {...$$restProps}
>
  <MenuItemContents {icon} {hasNotificationDot}>
    <slot />
  </MenuItemContents>
</MenuItemWrapper>
