<script lang="ts">
  import DynamicInput from '@mathesar/components/cell-fabric/DynamicInput.svelte';
  import { FieldErrors } from '@mathesar/components/form';
  import { WritableMap } from '@mathesar-component-library';

  import {
    type DataFormManager,
    EditableDataFormManager,
  } from '../data-form-utilities/DataFormManager';
  import type { DataFormField } from '../data-form-utilities/fields';

  const recordSummaries = new WritableMap<string, string>();

  export let dataFormManager: DataFormManager;
  export let dataFormField: DataFormField;
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
  $: recordSummary = recordSummaries.derivedValue(String($inputField));
</script>

<div class="data-form-input" class:selected={isSelected}>
  <DynamicInput
    bind:value={$inputField}
    componentAndProps={$inputComponentAndProps}
    hasError={displayError}
    disabled={$disabled}
    recordSummary={$recordSummary}
    setRecordSummary={(key, summary) => recordSummaries.set(key, summary)}
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
