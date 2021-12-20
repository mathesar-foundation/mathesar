<script lang='ts'>
  import EnumInput from './EnumInput.svelte';
  import StringInput from './StringInput..svelte';
  import BooleanInput from './BooleanInput.svelte';
  import type { DynamicInputType, DynamicInputElementType } from './types.d';

  /**
   * Type of input, one of: 'boolean', 'integer', 'float', 'string', 'date', 'datetime', 'time'
   */
  export let type: DynamicInputType;

  /**
   * Value of input. Depends on type.
   */
  export let value = undefined;

  // TODO: Use with label system
  /**
   * Id of the input.
   */
  export let id: string = undefined;

  /**
   * DOM input type for input.<br/>
   * boolean -> checkbox, toggle, select. Default: checkbox.<br/>
   * string -> text, textarea, select. Default: text.
   */
  export let inputType: DynamicInputElementType = undefined;

  let enumValues: unknown[] = undefined;

  /**
   * Applies when inputType is select. List of values to allow for value.
   */
  export { enumValues as enum };

  /**
   * Applies when inputType is select. Additional configuration for options
   * that are displayed.
   */
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
