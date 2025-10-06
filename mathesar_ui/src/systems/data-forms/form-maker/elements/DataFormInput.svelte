<script lang="ts">
  import type { FileManifest } from '@mathesar/api/rpc/records';
  import DynamicInput from '@mathesar/components/cell-fabric/DynamicInput.svelte';
  import { FieldErrors } from '@mathesar/components/form';
  import {
    type LabelController,
    WritableMap,
    hasStringProperty,
  } from '@mathesar-component-library';

  import {
    type DataFormManager,
    EditableDataFormManager,
  } from '../data-form-utilities/DataFormManager';
  import type { ColumnBasedDataFormField } from '../data-form-utilities/fields';

  const recordSummaries = new WritableMap<string, string>();
  const fileManifests = new WritableMap<string, FileManifest>();

  export let dataFormManager: DataFormManager;
  export let dataFormField: ColumnBasedDataFormField;
  export let labelController: LabelController;
  export let isSelected: boolean;
  export let placeholder: string | undefined = undefined;

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
  $: fileMash = (() => {
    try {
      const obj =
        typeof $inputField === 'object'
          ? $inputField
          : JSON.parse(String($inputField));
      return hasStringProperty(obj, 'mash') ? obj.mash : String($inputField);
    } catch {
      return String($inputField);
    }
  })();
  $: fileManifest = fileManifests.derivedValue(fileMash);
</script>

<div class="data-form-input" class:selected={isSelected}>
  <DynamicInput
    bind:value={$inputField}
    {labelController}
    id={dataFormField.key}
    componentAndProps={$inputComponentAndProps}
    hasError={displayError}
    disabled={$disabled}
    recordSummary={$recordSummary}
    setRecordSummary={(key, summary) => recordSummaries.set(key, summary)}
    fileManifest={$fileManifest}
    setFileManifest={(mash, manifest) => fileManifests.set(mash, manifest)}
    {placeholder}
  />
  {#if displayError}
    <FieldErrors field={inputField} />
  {/if}
</div>

<style lang="scss">
  .data-form-input {
    --input-element-min-height: 2.5rem;
    --text-area-min-height: 5.5rem;
  }
</style>
