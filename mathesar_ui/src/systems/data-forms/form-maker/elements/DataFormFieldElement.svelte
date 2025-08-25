<script lang="ts">
  import type { DataFormManager } from '../data-form-utilities/DataFormManager';
  import type { DataFormField } from '../data-form-utilities/fields';

  import ErrorFormFieldElement from './ErrorFormFieldElement.svelte';
  import FkFormFieldElement from './FkFormFieldElement.svelte';
  import FormFieldElementWrapper from './FormFieldElementWrapper.svelte';
  import ScalarFormFieldElement from './ScalarFormFieldElement.svelte';

  export let dataFormManager: DataFormManager;
  export let dataFormField: DataFormField;
</script>

<FormFieldElementWrapper
  {dataFormManager}
  {dataFormField}
  let:fieldElementProps
>
  {#if dataFormField.kind === 'scalar_column'}
    <ScalarFormFieldElement
      {...fieldElementProps}
      {dataFormManager}
      {dataFormField}
    />
  {:else if dataFormField.kind === 'foreign_key'}
    <FkFormFieldElement
      {...fieldElementProps}
      {dataFormManager}
      {dataFormField}
    />
  {:else}
    <ErrorFormFieldElement
      {...fieldElementProps}
      {dataFormManager}
      {dataFormField}
    />
  {/if}
</FormFieldElementWrapper>
