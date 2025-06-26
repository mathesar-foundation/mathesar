<script lang="ts">
  import type { DataFormManager } from '../DataFormManager';
  import type { EphermeralScalarField } from '../EphemeralDataForm';

  import DataFormInput from './DataFormInput.svelte';
  import DataFormLabel from './DataFormLabel.svelte';
  import FormFieldElementWrapper from './FormFieldElementWrapper.svelte';

  export let dataFormManager: DataFormManager;
  export let dataFormField: EphermeralScalarField;
</script>

<FormFieldElementWrapper {dataFormField} {dataFormManager} let:isSelected>
  <div class="scalar-field">
    <DataFormLabel {dataFormField} {isSelected} />
    <DataFormInput {dataFormField} {isSelected} />
  </div>
</FormFieldElementWrapper>

<style lang="scss">
  .scalar-field {
    display: flex;
    flex-direction: column;
    gap: var(--sm2);
  }
</style>
