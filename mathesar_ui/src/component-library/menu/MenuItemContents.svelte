<script lang="ts">
  import { onDestroy } from 'svelte';
  import type { IconProps } from '@mathesar-component-library-dir/icon/IconTypes';
  import Icon from '@mathesar-component-library-dir/icon/Icon.svelte';
  import { getGloballyUniqueId } from '@mathesar-component-library-dir/common/utils/domUtils';
  import { registerMenuItem, deregisterMenuItem } from './utils';

  export let icon: IconProps | undefined = undefined;
  export let hasNotificationDot = false;

  const id = getGloballyUniqueId();
  const hasControlSlot = !!$$slots.control;

  $: registerMenuItem(id, () => ({
    hasIcon: !!icon,
    hasControl: hasControlSlot,
  }));
  onDestroy(() => deregisterMenuItem(id));
</script>

<div class="control cell">
  <slot name="control" />
</div>
<div class="icon cell">
  {#if icon}<Icon {...icon} {hasNotificationDot} />{/if}
</div>
<div class="label cell"><slot /></div>
