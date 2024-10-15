<script lang="ts">
  import { onMount } from 'svelte';
  import { writable } from 'svelte/store';

  import Icon from '@mathesar-component-library-dir/icon/Icon.svelte';
  import type { IconProps } from '@mathesar-component-library-dir/icon/IconTypes';

  import { getMenuControllerFromContext } from './MenuController';

  const menu = getMenuControllerFromContext();
  const hasIconCell = writable(false);

  export let icon: IconProps | undefined = undefined;
  export let hasNotificationDot = false;

  $: $hasIconCell = !!icon;

  if (menu) {
    onMount(() => menu.hasControlColumn.registerInput($$slots.control));
    onMount(() => menu.hasIconColumn.registerInput(hasIconCell));
  }
</script>

<div class="control cell">
  <slot name="control" />
</div>
<div class="icon cell">
  {#if icon}<Icon {...icon} {hasNotificationDot} />{/if}
</div>
<div class="label cell"><slot /></div>
