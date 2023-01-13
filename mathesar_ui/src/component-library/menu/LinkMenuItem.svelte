<script lang="ts">
  import type { IconProps } from '@mathesar-component-library-dir/icon/IconTypes';
  import Icon from '@mathesar-component-library-dir/icon/Icon.svelte';

  export let icon: IconProps | undefined = undefined;
  export let href: string;
</script>

<a {href} class="menu-item menu-item-link" {...$$restProps}>
  <div class="spacer cell" />
  <div class="control cell" />
  <div class="icon cell">
    {#if icon}<Icon {...icon} />{/if}
  </div>
  <div class="label cell"><slot /></div>
  <div class="spacer cell" />
</a>
