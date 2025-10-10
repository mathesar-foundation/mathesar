<script lang="ts">
  import { _ } from 'svelte-i18n';

  import type { FileManifest } from '@mathesar/api/rpc/records';
  import DynamicInput from '@mathesar/components/cell-fabric/DynamicInput.svelte';
  import { FieldErrors } from '@mathesar/components/form';
  import WarningBox from '@mathesar/components/message-boxes/WarningBox.svelte';
  import { getFileStorageBackend } from '@mathesar/utils/preloadData';
  import {
    type LabelController,
    WritableMap,
    ensureReadable,
    hasStringProperty,
  } from '@mathesar-component-library';

  import {
    DataFormFillOutManager,
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
  $: filloutDataFormManager =
    dataFormManager instanceof DataFormFillOutManager
      ? dataFormManager
      : undefined;

  $: ({ fieldValueHolder, inputComponentAndProps, fieldColumn, isRequired } =
    dataFormField);
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
  $: token = ensureReadable(filloutDataFormManager?.token);
  $: fileRequestParams = $token
    ? {
        form_token: $token,
        form_field_key: dataFormField.key,
      }
    : undefined;
  $: isFileType = fieldColumn.abstractType.identifier === 'file';
  $: isAnonymousFileStorageAccessAllowed = (() => {
    const fileBackendName = fieldColumn.column.metadata?.file_backend;
    if (!fileBackendName) {
      return false;
    }
    const fileStorageBackend = getFileStorageBackend(fileBackendName);
    if (!fileStorageBackend) {
      return false;
    }
    return fileStorageBackend.anonymous_access;
  })();
  $: inputDisabled =
    $disabled || (isFileType && !isAnonymousFileStorageAccessAllowed);
</script>

<div class="data-form-input" class:selected={isSelected}>
  {#if isFileType && !isAnonymousFileStorageAccessAllowed}
    {#if editableDataFormManager}
      <WarningBox>
        {$_('anonymous_file_uploads_disabled')}
      </WarningBox>
    {:else}
      <div class="disabled-file-input-help">
        {$_('anonymous_file_uploads_disabled_public')}
        {#if !$isRequired}
          {$_('can_submit_without_uploading_file')}
        {/if}
      </div>
    {/if}
  {/if}
  <DynamicInput
    bind:value={$inputField}
    {labelController}
    id={dataFormField.key}
    componentAndProps={$inputComponentAndProps}
    hasError={displayError}
    disabled={inputDisabled}
    recordSummary={$recordSummary}
    setRecordSummary={(key, summary) => recordSummaries.set(key, summary)}
    fileManifest={$fileManifest}
    setFileManifest={(mash, manifest) => fileManifests.set(mash, manifest)}
    {fileRequestParams}
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
    display: flex;
    flex-direction: column;
    gap: var(--sm3);

    .disabled-file-input-help {
      color: var(--color-fg-base-disabled);
    }
  }
</style>
