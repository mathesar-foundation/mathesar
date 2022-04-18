<script lang="ts">
  import Select from '@mathesar-component-library-dir/select/Select.svelte';
  import type { Appearance } from '@mathesar-component-library-dir/types';
  import {
    generateSelectOptions,
    getSelectedValue,
    getInitialValue,
  } from './utils';
  import type {
    DynamicInputDataType,
    DynamicInputSelectElement,
    EnumSelectOption,
  } from './types';

  export let dataType: DynamicInputDataType;
  export let enumValues: unknown[] | undefined = undefined;
  export let options: DynamicInputSelectElement['options'] = undefined;
  export let triggerAppearance: Appearance = 'default';
  export let value = getInitialValue(dataType, enumValues);

  $: selectOptions = generateSelectOptions(dataType, enumValues, options);
  $: selectedValue = getSelectedValue(selectOptions, value);

  // TODO: Handle indeterminate state for boolean

  function onChange(e: CustomEvent<EnumSelectOption | undefined>) {
    value = e.detail?.value;
  }
</script>

<Select
  {...$$restProps}
  {triggerAppearance}
  options={selectOptions}
  value={selectedValue}
  on:change={onChange}
/>
