<script lang="ts">
  import LabeledInput from '@mathesar-component-library-dir/labeled-input/LabeledInput.svelte';
  import DynamicInput from '@mathesar-component-library-dir/dynamic-input/DynamicInput.svelte';
  import type { DynamicInputDataType } from '@mathesar-component-library-dir/dynamic-input/types.d';
  import type {
    FormInputElement,
    FormInputStore,
    FormValidationCheck,
  } from './types.d';

  export let type: DynamicInputDataType;
  export let label: FormInputElement['label'] = undefined;
  export let store: FormInputStore;
  export let validationErrors: FormValidationCheck[];
</script>

<div class="form-element form-input">
  <LabeledInput
    {label}
    layout={type === 'boolean' ? 'inline-input-first' : 'stacked'}
  >
    <DynamicInput
      {...$$restProps}
      dataType={type}
      {label}
      bind:value={$store}
    />
  </LabeledInput>

  {#each validationErrors as error (error)}
    <div>{error}</div>
  {/each}
</div>
