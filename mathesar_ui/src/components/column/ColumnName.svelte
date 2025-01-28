<script lang="ts">
  import type { ComponentProps } from 'svelte';

  import NameWithIcon from '@mathesar/components/NameWithIcon.svelte';
  import { getColumnIconProps } from '@mathesar/utils/columnUtils';

  interface $$Props extends Omit<ComponentProps<NameWithIcon>, 'icon'> {
    column: { name: string } & Parameters<typeof getColumnIconProps>[0];
  }

  export let column: $$Props['column'];

  $: icon = getColumnIconProps(column);
</script>

<NameWithIcon on:click {icon} {...$$restProps}>
  {column.name}
</NameWithIcon>
