<script lang="ts">
  import type { DataFormManager } from '../data-form-utilities/DataFormManager';
  import type { ScalarField } from '../data-form-utilities/ScalarField';

  import DataFormInput from './DataFormInput.svelte';
  import DataFormLabel from './DataFormLabel.svelte';

  export let isSelected: boolean;
  export let dataFormManager: DataFormManager;
  export let dataFormField: ScalarField;
</script>

<div class="scalar-field">
  <DataFormLabel {dataFormManager} {dataFormField} {isSelected} />
  <DataFormInput {dataFormManager} {dataFormField} {isSelected} />
</div>

<style lang="scss">
  .scalar-field {
    display: flex;
    flex-direction: column;
    gap: var(--data_forms__label-input-gap);
  }
</style>
