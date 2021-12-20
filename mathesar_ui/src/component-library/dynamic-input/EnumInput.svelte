<script lang='ts'>
  import Select from '@mathesar-component-library-dir/select/Select.svelte';
  import type { Appearance } from '@mathesar-component-library-dir/types.d';
  import { generateSelectOptions, getSelectedValue, getInitialValue } from './utils';
  import type { DynamicInputType } from './types';

  export let type: DynamicInputType;
  export let enumValues: unknown[] = undefined;
  export let options = undefined;
  export let triggerAppearance: Appearance = 'default';
  export let value = getInitialValue(type, enumValues);

  $: selectOptions = generateSelectOptions(type, enumValues, options);
  $: selectedValue = getSelectedValue(selectOptions, value);

  // TODO: Handle indeterminate state for boolean

  function onChange(e: CustomEvent<{ option: { value: unknown } }>) {
    value = e.detail?.option.value;
  }
</script>

<Select idKey="value" {...$$restProps} {triggerAppearance}
  options={selectOptions} value={selectedValue} on:change={onChange}/>
