<script lang="ts">
  import type { DataFormManager } from '../data-form-utilities/DataFormManager';
  import type { EphemeralDataFormField } from '../data-form-utilities/types';

  import FkFormFieldElement from './FkFormFieldElement.svelte';
  import FormFieldElementWrapper from './FormFieldElementWrapper.svelte';
  import ScalarFormFieldElement from './ScalarFormFieldElement.svelte';

  export let dataFormManager: DataFormManager;
  export let dataFormField: EphemeralDataFormField;
</script>

<FormFieldElementWrapper {dataFormManager} {dataFormField} let:isSelected>
  {#if dataFormField.kind === 'scalar_column'}
    <ScalarFormFieldElement {isSelected} {dataFormManager} {dataFormField} />
  {:else if dataFormField.kind === 'foreign_key'}
    <FkFormFieldElement {isSelected} {dataFormManager} {dataFormField} />
  {/if}
</FormFieldElementWrapper>
