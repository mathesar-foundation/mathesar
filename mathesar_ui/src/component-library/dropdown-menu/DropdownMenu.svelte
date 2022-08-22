<script lang="ts">
  import Dropdown from '@mathesar-component-library-dir/dropdown/Dropdown.svelte';
  import Menu from '@mathesar-component-library-dir/menu/Menu.svelte';
  import Icon from '@mathesar-component-library-dir/icon/Icon.svelte';
  import type { IconProps } from '@mathesar-component-library-dir/icon/IconTypes';

  export let label: string;
  export let icon: IconProps | undefined = undefined;
  export let closeOnInnerClick = true;
</script>

<Dropdown {closeOnInnerClick} ariaLabel={label} {...$$restProps}>
  <span class="dropdown-menu-trigger" slot="trigger">
    {#if icon}
      <Icon {...icon} />
    {/if}
    <span class="label">{label}</span>
  </span>
  <Menu slot="content" --min-width="100%">
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
