<script lang="ts">
  // TODO: Use FormField component here
  import LabeledInput from '@mathesar-component-library-dir/labeled-input/LabeledInput.svelte';
  import DynamicInput from '@mathesar-component-library-dir/dynamic-input/DynamicInput.svelte';
  import type { DynamicInputDataType } from '@mathesar-component-library-dir/dynamic-input/types';
  import type {
    FormInputElement,
    FormValueStore,
    FormValidationCheck,
  } from './types';

  export let type: DynamicInputDataType;
  export let label: FormInputElement['label'] = undefined;
  export let store: FormValueStore;
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
      hasError={validationErrors.length > 0}
      bind:value={$store}
    />
  </LabeledInput>

  {#each validationErrors as error (error)}
    <div class="validation-error">
      {#if error === 'isEmpty'}
        * This is a required field
      {:else}
        {error}
      {/if}
    </div>
  {/each}
</div>
