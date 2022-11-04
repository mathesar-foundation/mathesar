<script lang="ts">
  import NameWithIcon from '@mathesar/components/NameWithIcon.svelte';
  import type { DisplayColumn } from './types';
  import { getColumnIconProps } from '@mathesar/utils/columnUtils';

  export let column: DisplayColumn;
  export let isLoading = false;

  $: icon = getColumnIconProps(column);
</script>

<NameWithIcon on:click {icon} {isLoading}>{column.name}</NameWithIcon>
