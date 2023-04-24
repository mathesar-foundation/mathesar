<script lang="ts">
  import type { IconProps } from '@mathesar-component-library-dir/icon/IconTypes';
  import Icon from '@mathesar-component-library-dir/icon/Icon.svelte';

  export let icon: IconProps | undefined = undefined;
  export let hasNotificationDot = false;
</script>

<div class="spacer cell" />
<div class="control cell">
  <slot name="control" />
</div>
<div class="icon cell">
  {#if icon}<Icon {...icon} {hasNotificationDot} />{/if}
</div>
<div class="label cell"><slot /></div>
<div class="spacer cell" />
