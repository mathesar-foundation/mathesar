<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  import type { FileManifest } from '@mathesar/api/rpc/records';
  import BaseInput from '@mathesar/component-library/common/base-components/BaseInput.svelte';
  import FileCellContent from '@mathesar/components/file-attachments/cell-content/FileCellContent.svelte';
  import { FileViewerController } from '@mathesar/components/file-attachments/cell-content/FileViewerController';
  import { fileDetailDropdownContext } from '@mathesar/components/file-attachments/file-detail-dropdown/FileDetailDropdownController';
  import { modalFileAttachmentUploadContext } from '@mathesar/components/file-attachments/file-uploader/modalFileAttachmentUploadContext';
  import {
    getFileViewerType,
    parseFileReference,
  } from '@mathesar/components/file-attachments/fileUtils';
  import { lightboxContext } from '@mathesar/components/file-attachments/lightbox/LightboxController';
  import {
    getGloballyUniqueId,
    getLabelControllerFromContainingLabel,
    getLabelIdFromInputId,
  } from '@mathesar-component-library';

  const thumbnailResolutionHeightPx = 400;
  const labelController = getLabelControllerFromContainingLabel();
  const dispatch = createEventDispatcher();
  const lightboxController = lightboxContext.get();
  const fileDetailController = fileDetailDropdownContext.get();
  const modalFileAttachmentUploader = modalFileAttachmentUploadContext.get();

  export let id = getGloballyUniqueId();
  export let value: unknown = undefined;
  let classes: string | undefined = '';
  export { classes as class };
  export let disabled = false;
  export let fileManifest: FileManifest | undefined = undefined;
  export let setFileManifest:
    | ((mash: string, manifest: FileManifest) => void)
    | undefined = undefined;

  let element: HTMLSpanElement;

  $: hasValue = value !== undefined && value !== null && value !== '';
  $: labelController?.inputId.set(id);
  $: showLargerInput =
    hasValue && fileManifest && getFileViewerType(fileManifest) === 'image';

  function updateCell(newValue: unknown) {
    value = newValue;
    dispatch('artificialChange', value);
    dispatch('artificialInput', value);
  }

  $: fileViewerController = fileManifest
    ? new FileViewerController({
        manifest: fileManifest,
        removeFile: () => updateCell(null),
        lightboxController,
        fileDetailController,
        onClose: () => element.focus(),
      })
    : undefined;

  function clear() {
    value = null;
    dispatch('artificialChange', value);
    dispatch('artificialInput', value);
    fileViewerController?.close();
  }

  async function upload() {
    if (disabled) return; // Disallow uploads on read-only inputs
    if (!modalFileAttachmentUploader) return;
    const attachment =
      await modalFileAttachmentUploader.acquireFileAttachment();
    if (!attachment) return;
    const fileReference = parseFileReference(attachment.result);
    if (!fileReference) return;
    updateCell(attachment.result);
    setFileManifest?.(fileReference.mash, attachment.download_link);
  }

  function handleKeydown(e: KeyboardEvent) {
    switch (e.key) {
      case 'Enter':
        if (e.target === element) {
          if (fileManifest) {
            void fileViewerController?.openFileViewer();
          } else {
            void upload();
          }
        }
        break;
      case 'Delete':
      case 'Backspace':
        clear();
        break;
      default:
        break;
    }
  }

  function handleFocus() {
    window.addEventListener('keydown', handleKeydown);
  }
  function handleBlur() {
    window.removeEventListener('keydown', handleKeydown);
  }
</script>

<BaseInput {disabled} {...$$restProps} bind:id />

<span
  {id}
  class="input-element file-input {classes}"
  class:has-value={hasValue}
  class:disabled
  tabindex={disabled ? undefined : 0}
  bind:this={element}
  on:focus={handleFocus}
  on:focus
  on:blur={handleBlur}
  on:blur
  role="listbox"
  aria-labelledby={getLabelIdFromInputId(id)}
>
  <div class="file-input-content" class:large={showLargerInput}>
    <FileCellContent
      {value}
      {fileViewerController}
      {thumbnailResolutionHeightPx}
      canUpload={!disabled}
      {upload}
    />
  </div>
</span>

<style>
  .file-input {
    display: grid;
    overflow: hidden;
    padding: var(--sm5);
  }
  .file-input-content.large {
    height: 10em;
  }
</style>
