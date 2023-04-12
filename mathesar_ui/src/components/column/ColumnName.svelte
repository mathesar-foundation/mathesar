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
  <span class="column-name">{column.name}</span>
</NameWithIcon>

<style lang="scss">
  .column-name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
</style>
