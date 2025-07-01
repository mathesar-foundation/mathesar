<script lang="ts">
  import type { EphermeralScalarField } from '../EphemeralDataForm';

  import DataFormInput from './DataFormInput.svelte';
  import DataFormLabel from './DataFormLabel.svelte';

  export let isSelected: boolean;
  export let dataFormField: EphermeralScalarField;
</script>

<div class="scalar-field">
  <DataFormLabel {dataFormField} {isSelected} />
  <DataFormInput {dataFormField} {isSelected} />
</div>

<style lang="scss">
  .scalar-field {
    display: flex;
    flex-direction: column;
    gap: var(--data_forms__label-input-gap);
  }
</style>
