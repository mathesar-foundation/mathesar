<script lang='ts'>
  import EnumInput from './EnumInput.svelte';
  import StringInput from './StringInput..svelte';
  import BooleanInput from './BooleanInput.svelte';
  import NumberInput from '../number-input/NumberInput.svelte';
  import type {
    DynamicInputDataType,
    DynamicInputInterfaceType,
    DynamicInputSelectElement,
  } from './types.d';

  /**
   * Type of input, one of: 'boolean', 'integer', 'float', 'string', 'date', 'datetime', 'time'
   */
  export let dataType: DynamicInputDataType;

  /**
   * Value of input. Depends on type.
   */
  export let value = undefined;

  /**
   * DOM input type for input.<br/>
   * boolean -> checkbox, toggle, select. Default: checkbox.<br/>
   * string -> text, textarea, select. Default: text.
   */
  export let interfaceType: DynamicInputInterfaceType = undefined;

  let enumValues: unknown[] = undefined;

  /**
   * Applies when interfaceType is select. List of values to allow for value.
   */
  export { enumValues as enum };

  /**
   * Applies when interfaceType is select. Additional configuration for options
   * that are displayed.
   */
  export let options: DynamicInputSelectElement['options'] = undefined;
</script>

{#if enumValues || interfaceType === 'select'}
  <EnumInput {...$$restProps} {enumValues} {dataType} {options} bind:value/>
{:else if dataType === 'boolean'}
  <BooleanInput {...$$restProps} {interfaceType} bind:value/>
{:else if dataType === 'integer' || dataType === 'float'}
  <NumberInput {...$$restProps} isInteger={dataType === 'integer'} bind:value/>
{:else if dataType === 'string'}
  <StringInput {...$$restProps} {interfaceType} bind:value/>
{/if}
