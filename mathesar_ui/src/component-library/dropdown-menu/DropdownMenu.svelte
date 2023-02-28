<script lang="ts">
  import Dropdown from '@mathesar-component-library-dir/dropdown/Dropdown.svelte';
  import Menu from '@mathesar-component-library-dir/menu/Menu.svelte';
  import Icon from '@mathesar-component-library-dir/icon/Icon.svelte';
  import type { IconProps } from '@mathesar-component-library-dir/icon/IconTypes';

  // TODO: Find some way to provide better typings
  // for the inherited props from the Dropdown component
  // interface $$RestProps extends ComponentProps<Dropdown> {};

  export let label = '';
  export let ariaLabel: string | undefined = undefined;
  export let icon: IconProps | undefined = undefined;
  export let closeOnInnerClick = true;
  export let menuStyle = '';
  export let dropdownClass='';
</script>

<Dropdown {closeOnInnerClick} ariaLabel={ariaLabel ?? label} {...$$restProps} contentClass={dropdownClass}>
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
  <Menu slot="content" style="--min-width: 100%;{menuStyle}">
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
