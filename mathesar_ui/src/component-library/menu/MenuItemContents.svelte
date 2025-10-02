<script lang="ts">
  import { onMount } from 'svelte';
  import { writable } from 'svelte/store';

  import { iconChooseItemNext } from '@mathesar-component-library-dir/common/icons';
  import Icon from '@mathesar-component-library-dir/icon/Icon.svelte';
  import type { IconProps } from '@mathesar-component-library-dir/icon/IconTypes';

  import { menuControllerContext } from './MenuController';

  const menu = menuControllerContext.getOrError();
  const hasIconCell = writable(false);
  const hasSubMenuStore = writable(false);

  export let icon: IconProps | undefined = undefined;
  export let hasNotificationDot = false;
  export let hasSubMenu = false;

  $: $hasIconCell = !!icon;
  $: $hasSubMenuStore = hasSubMenu;

  if (menu) {
    onMount(() => menu.hasControlColumn.registerInput($$slots.control));
    onMount(() => menu.hasIconColumn.registerInput(hasIconCell));
    onMount(() => menu.hasSubMenu.registerInput(hasSubMenuStore));
  }
</script>

<div class="control cell">
  <slot name="control" />
</div>
<div class="icon cell">
  {#if icon}<Icon {...icon} {hasNotificationDot} />{/if}
</div>
<div class="label cell"><slot /></div>
<div class="sub-menu cell">
  {#if hasSubMenu}
    <Icon {...iconChooseItemNext} />
  {/if}
</div>
