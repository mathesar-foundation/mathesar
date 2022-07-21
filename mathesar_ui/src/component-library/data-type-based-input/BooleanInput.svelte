<script lang="ts">
  import Checkbox from '@mathesar-component-library-dir/checkbox/Checkbox.svelte';
  import type { DataTypeBasedInputInterface } from './types';

  export let value = false;
  export let interfaceType: DataTypeBasedInputInterface = 'checkbox';
</script>

{#if interfaceType === 'toggle'}
  <!--TODO: Add css to checkbox to show a toggle view -->
  Toggle not implemented yet
{:else}
  <Checkbox {...$$restProps} bind:checked={value} />
{/if}
