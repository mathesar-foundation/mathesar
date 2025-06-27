<script lang="ts">
  import type { DataFormManager } from '../DataFormManager';
  import type { EphemeralDataFormField } from '../EphemeralDataForm';

  import FkFormFieldElement from './FkFormFieldElement.svelte';
  import FormFieldElementWrapper from './FormFieldElementWrapper.svelte';
  import ScalarFormFieldElement from './ScalarFormFieldElement.svelte';

  export let dataFormManager: DataFormManager;
  export let dataFormField: EphemeralDataFormField;
</script>

<FormFieldElementWrapper
  {dataFormField}
  {dataFormManager}
  let:isSelected
>
  {#if dataFormField.kind === 'scalar_column'}
    <ScalarFormFieldElement {isSelected} {dataFormField} />
  {:else if dataFormField.kind === 'foreign_key'}
    <FkFormFieldElement {isSelected} {dataFormManager} {dataFormField} />
  {:else}
    <div></div>
  {/if}
</FormFieldElementWrapper>
