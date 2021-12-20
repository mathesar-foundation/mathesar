<script lang='ts'>
  import Select from '@mathesar-component-library-dir/select/Select.svelte';
  import { generateSelectOptions } from './utils';
  import type { DynamicInputType } from './types';
  
  export let value = undefined;
  export let type: DynamicInputType;
  export let enumValues: unknown[] = undefined;
  export let options = undefined;

  $: selectOptions = generateSelectOptions(type, enumValues, options);
</script>

<Select options={selectOptions}/>
