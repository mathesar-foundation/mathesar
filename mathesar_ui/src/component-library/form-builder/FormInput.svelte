<script lang="ts">
  // TODO: Use FormField component here
  import DataTypeBasedInput from '@mathesar/component-library/data-type-based-input/DataTypeBasedInput.svelte';
  import type { DataTypeBasedInputType } from '@mathesar/component-library/data-type-based-input/types';
  import LabeledInput from '@mathesar-component-library-dir/labeled-input/LabeledInput.svelte';

  import type {
    FormInputElement,
    FormValidationCheck,
    FormValueStore,
  } from './types';

  export let type: DataTypeBasedInputType;
  export let text: FormInputElement['text'] = undefined;
  export let label: FormInputElement['label'] = undefined;
  export let store: FormValueStore;
  export let validationErrors: FormValidationCheck[];
</script>

<div class="form-element form-input">
  <LabeledInput
    {label}
    layout={type === 'boolean' ? 'inline-input-first' : 'stacked'}
    help={text?.help}
    helpType="tooltip"
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
