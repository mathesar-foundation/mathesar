<script lang="ts">
  import type { ComponentProps } from 'svelte';

  import Dropdown from '@mathesar-component-library-dir/dropdown/Dropdown.svelte';
  import Icon from '@mathesar-component-library-dir/icon/Icon.svelte';
  import type { IconProps } from '@mathesar-component-library-dir/icon/IconTypes';
  import Menu from '@mathesar-component-library-dir/menu/Menu.svelte';

  interface $$Props extends ComponentProps<Dropdown> {
    label?: string;
    icon?: IconProps;
    menuStyle?: string;
  }

  export let label = '';
  export let ariaLabel: string | undefined = undefined;
  export let icon: IconProps | undefined = undefined;
  export let closeOnInnerClick = true;
  export let menuStyle = '';
</script>

<Dropdown
  {closeOnInnerClick}
  ariaLabel={ariaLabel ?? label}
  {...$$restProps}
  on:open
  on:close
>
  <slot name="trigger" slot="trigger">
    <span class="dropdown-menu-trigger">
      {#if icon}
        <Icon {...icon} />
      {/if}
      {#if label}
        <span class="label">{label}</span>
      {/if}
    </span>
  </slot>
  <Menu slot="content" style="--Menu__min-width: 100%;{menuStyle}">
    <slot />
  </Menu>
</Dropdown>

<style>
  .dropdown-menu-trigger {
    display: flex;
    align-items: center;
  }
  .dropdown-menu-trigger > :global(* + *) {
    margin-left: 0.4em;
  }
</style>
