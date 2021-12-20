<script lang='ts'>
  import EnumInput from './EnumInput.svelte';
  import StringInput from './StringInput..svelte';
  import BooleanInput from './BooleanInput.svelte';
  import type { DynamicInputType, DynamicInputElementType } from './types.d';

  export let type: DynamicInputType;
  export let value = undefined;

  // For use with label
  export let id: string = undefined;
  export let inputType: DynamicInputElementType = undefined;

  let enumValues: unknown[] = undefined;
  export { enumValues as enum };
  export let options = undefined;
</script>

<div class="dynamic-input">
  {#if enumValues || inputType === 'select'}
    <EnumInput {...$$restProps} {enumValues} {type} {options} bind:value/>
  {:else}
    {#if type === 'boolean'}
      <BooleanInput {...$$restProps} {inputType} bind:value/>
    {:else if type === 'string'}
      <StringInput {...$$restProps} {inputType} bind:value/>
    {/if}
  {/if}
</div>
