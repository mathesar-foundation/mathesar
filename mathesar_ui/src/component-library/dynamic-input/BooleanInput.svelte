<script lang='ts'>
  import Checkbox from '@mathesar-component-library-dir/checkbox/Checkbox.svelte';
  import type { DynamicInputElementType } from './types.d';

  export let value = undefined;
  export let inputType: DynamicInputElementType = undefined;
</script>

{#if inputType === 'toggle'}
  <!--TODO: Add css to checkbox to show a toggle view -->
  Toggle not implemented yet
{:else}
  <Checkbox {...$$restProps} bind:checked={value}/>
{/if}
