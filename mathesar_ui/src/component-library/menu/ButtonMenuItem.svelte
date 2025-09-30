<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  import type { IconProps } from '@mathesar-component-library-dir/icon/IconTypes';
  import StringOrComponent from '@mathesar-component-library-dir/string-or-component/StringOrComponent.svelte';
  import type { ComponentAndProps } from '@mathesar-component-library-dir/types';

  import MenuItemContents from './MenuItemContents.svelte';

  const dispatch = createEventDispatcher();

  export let label: string | ComponentAndProps | undefined = undefined;
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

<button
  on:click={handleClick}
  {disabled}
  role="menuitem"
  data-menu-item-focusable={disabled ? undefined : ''}
  class="menu-item menu-item-button"
  class:disabled
  class:danger
>
  <MenuItemContents {icon} {hasNotificationDot}>
    <slot>
      {#if label}
        <StringOrComponent arg={label} />
      {/if}
    </slot>
  </MenuItemContents>
</button>
