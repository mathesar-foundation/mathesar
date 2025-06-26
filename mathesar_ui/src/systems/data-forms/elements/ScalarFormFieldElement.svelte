<script lang="ts">
  import type { DataFormManager } from '../DataFormManager';
  import type { EphermeralScalarField } from '../EphemeralDataForm';

  import DataFormInput from './DataFormInput.svelte';
  import FormFieldElementWrapper from './FormFieldElementWrapper.svelte';

  export let dataFormManager: DataFormManager;
  export let dataFormField: EphermeralScalarField;
</script>

<FormFieldElementWrapper {dataFormField} {dataFormManager} let:isSelected>
  <DataFormInput {dataFormManager} {dataFormField} {isSelected} />
</FormFieldElementWrapper>
