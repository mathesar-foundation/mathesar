<script lang="ts">
  import type { ComponentProps } from 'svelte';

  import NameWithIcon from '@mathesar/components/NameWithIcon.svelte';
  import { getColumnIconProps } from '@mathesar/utils/columnUtils';
  import type { DisplayColumn } from './types';

  interface $$Props extends Omit<ComponentProps<NameWithIcon>, 'icon'> {
    column: DisplayColumn;
  }

  export let column: DisplayColumn;

  $: icon = getColumnIconProps(column);
</script>

<NameWithIcon on:click {icon} {...$$restProps}>
  {column.name}
</NameWithIcon>
