<script lang="ts">
  import { _ } from 'svelte-i18n';

  import DynamicInput from '@mathesar/components/cell-fabric/DynamicInput.svelte';
  import { FieldErrors } from '@mathesar/components/form';

  import type { EphermeralFkField } from '../data-form-utilities/EphemeralFkField';
  import type { EphermeralScalarField } from '../data-form-utilities/EphemeralScalarField';

  export let dataFormField: EphermeralScalarField | EphermeralFkField;
  export let isSelected: boolean;

  $: ({ fieldStore, inputComponentAndProps } = dataFormField);
  $: fieldValueStore = $fieldStore;
  $: ({ showsError, disabled } = fieldValueStore);
</script>

<div class="data-form-input" class:selected={isSelected}>
  <DynamicInput
    bind:value={$fieldValueStore}
    componentAndProps={$inputComponentAndProps}
    hasError={$showsError}
    disabled={$disabled}
  />
  <FieldErrors field={fieldValueStore} />
</div>

<style lang="scss">
  .data-form-input {
    --input-min-height: 2.5rem;
    --text-area-min-height: 5.5rem;
  }
</style>
