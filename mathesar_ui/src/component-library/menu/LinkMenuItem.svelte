<script lang="ts">
  import type { IconProps } from '@mathesar-component-library-dir/icon/IconTypes';
  import StringOrComponent from '@mathesar-component-library-dir/string-or-component/StringOrComponent.svelte';
  import type { ComponentAndProps } from '@mathesar-component-library-dir/types';

  import MenuItemContents from './MenuItemContents.svelte';

  export let label: string | ComponentAndProps | undefined = undefined;
  export let icon: IconProps | undefined = undefined;
  export let href: string;
  export let hasNotificationDot = false;
  export let disabled = false;
  export let active = false;
</script>

<a
  class="menu-item menu-item-link"
  class:active
  class:disabled
  href={disabled ? undefined : href}
  {...$$restProps}
>
  <MenuItemContents {icon} {hasNotificationDot}>
    <slot>
      {#if label}
        <StringOrComponent arg={label} />
      {/if}
    </slot>
  </MenuItemContents>
</a>
