<script lang="ts">
  import EnumInput from './EnumInput.svelte';
  import StringInput from './StringInput.svelte';
  import BooleanInput from './BooleanInput.svelte';
  import NumberInput from '../number-input/NumberInput.svelte';
  import type {
    DynamicInputDataType,
    DynamicInputInterfaceType,
    DynamicInputSelectElement,
  } from './types';

  /**
   * Type of input, one of: 'boolean', 'integer', 'float', 'string', 'date', 'datetime', 'time'
   */
  export let dataType: DynamicInputDataType = 'string';

  /**
   * Value of input. Depends on type.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export let value: any = undefined;

  /**
   * DOM input type for input.<br/>
   * boolean -> checkbox, toggle, select. Default: checkbox.<br/>
   * string -> text, textarea, select. Default: text.
   */
  // @ts-ignore: https://github.com/centerofci/mathesar/issues/1055
  export let interfaceType: DynamicInputInterfaceType = undefined;

  // @ts-ignore: https://github.com/centerofci/mathesar/issues/1055
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
  <EnumInput {...$$restProps} {enumValues} {dataType} {options} bind:value />
{:else if dataType === 'boolean'}
  <BooleanInput {...$$restProps} {interfaceType} bind:value />
{:else if dataType === 'integer' || dataType === 'float'}
  <NumberInput {...$$restProps} isInteger={dataType === 'integer'} bind:value />
{:else if dataType === 'string'}
  <StringInput {...$$restProps} {interfaceType} bind:value />
{/if}
