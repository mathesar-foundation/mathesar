<script lang="ts">
  import { _ } from 'svelte-i18n';

  import DynamicInput from '@mathesar/components/cell-fabric/DynamicInput.svelte';
  import { FieldErrors } from '@mathesar/components/form';

  import {
    type DataFormManager,
    EditableDataFormManager,
  } from '../data-form-utilities/DataFormManager';
  import type { FkField } from '../data-form-utilities/FkField';
  import type { ScalarField } from '../data-form-utilities/ScalarField';

  export let dataFormManager: DataFormManager;
  export let dataFormField: ScalarField | FkField;
  export let isSelected: boolean;

  $: editableDataFormManager =
    dataFormManager instanceof EditableDataFormManager
      ? dataFormManager
      : undefined;

  $: ({ fieldValueHolder, inputComponentAndProps } = dataFormField);
  $: ({ inputFieldStore } = fieldValueHolder);
  $: inputField = $inputFieldStore;
  $: ({ showsError, disabled } = inputField);

  $: displayError = !editableDataFormManager && $showsError;
</script>

<div class="data-form-input" class:selected={isSelected}>
  <DynamicInput
    bind:value={$inputField}
    componentAndProps={$inputComponentAndProps}
    hasError={displayError}
    disabled={$disabled}
  />
  {#if displayError}
    <FieldErrors field={inputField} />
  {/if}
</div>

<style lang="scss">
  .data-form-input {
    --input-min-height: 2.5rem;
    --text-area-min-height: 5.5rem;
  }
</style>
