<script lang="ts">
  import Dropdown from '@mathesar-component-library-dir/dropdown/Dropdown.svelte';
  import Menu from '@mathesar-component-library-dir/menu/Menu.svelte';
  import Icon from '@mathesar-component-library-dir/icon/Icon.svelte';
  import type { IconProps } from '@mathesar-component-library-dir/icon/Icon.d';

  export let label: string;
  export let icon: IconProps | undefined = undefined;
</script>

<Dropdown closeOnInnerClick={true} ariaLabel={label}>
  <span slot="trigger">
    {#if icon}
      <Icon {...icon} />
    {/if}
    <span class="label">{label}</span>
  </span>
  <Menu slot="content" --min-width="100%">
    <slot />
  </Menu>
</Dropdown>
