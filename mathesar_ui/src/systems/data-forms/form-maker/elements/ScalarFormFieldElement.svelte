<script lang="ts">
  import type { LabelController } from '@mathesar-component-library';

  import type { DataFormManager } from '../data-form-utilities/DataFormManager';
  import type { ScalarField } from '../data-form-utilities/fields';

  import DataFormInput from './DataFormInput.svelte';
  import DataFormLabel from './DataFormLabel.svelte';

  export let isSelected: boolean;
  export let dataFormManager: DataFormManager;
  export let dataFormField: ScalarField;
  export let labelController: LabelController;

  $: inputProps = {
    dataFormManager,
    dataFormField,
    labelController,
    isSelected,
  };
</script>

<div class="scalar-field">
  <DataFormLabel {...inputProps} />
  <DataFormInput {...inputProps} />
</div>

<style lang="scss">
  .scalar-field {
    display: flex;
    flex-direction: column;
    gap: var(--df__internal__label-input-gap);
  }
</style>
