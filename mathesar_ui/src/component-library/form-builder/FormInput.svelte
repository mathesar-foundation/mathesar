<script lang='ts'>
  import LabeledInput from '@mathesar-component-library-dir/labeled-input/LabeledInput.svelte';
  import DynamicInput from '@mathesar-component-library-dir/dynamic-input/DynamicInput.svelte';
  import type { DynamicInputType } from '@mathesar-component-library-dir/dynamic-input/types.d';
  import type { LayoutInputElement } from './types.d';

  export let type: DynamicInputType;
  export let label: LayoutInputElement['label'];
  export let store;
</script>

<div class="form-element form-input">
  <LabeledInput {label} layout={type === 'boolean' ? 'inline-input-first' : 'stacked'}>
    <DynamicInput {...$$restProps} {type} {label} bind:value={$store}/>
  </LabeledInput>
</div>
