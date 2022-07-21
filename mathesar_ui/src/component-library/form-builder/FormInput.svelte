<script lang="ts">
  // TODO: Use FormField component here
  import LabeledInput from '@mathesar-component-library-dir/labeled-input/LabeledInput.svelte';
  import DataTypeBasedInput from '@mathesar/component-library/data-type-based-input/DataTypeBasedInput.svelte';
  import type { DataTypeBasedInputType } from '@mathesar/component-library/data-type-based-input/types';
  import type {
    FormInputElement,
    FormValueStore,
    FormValidationCheck,
  } from './types';

  export let type: DataTypeBasedInputType;
  export let label: FormInputElement['label'] = undefined;
  export let store: FormValueStore;
  export let validationErrors: FormValidationCheck[];
</script>

<div class="form-element form-input">
  <LabeledInput
    {label}
    layout={type === 'boolean' ? 'inline-input-first' : 'stacked'}
  >
    <DataTypeBasedInput
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
