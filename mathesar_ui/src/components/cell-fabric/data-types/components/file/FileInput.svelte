<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  import type { FileManifest } from '@mathesar/api/rpc/records';
  import BaseInput from '@mathesar/component-library/common/base-components/BaseInput.svelte';
  import FileCellContent from '@mathesar/components/file-attachments/cell-content/FileCellContent.svelte';
  import { modalFileAttachmentUploadContext } from '@mathesar/components/file-attachments/file-uploader/modalFileAttachmentUploadContext';
  import {
    getFileViewerType,
    parseFileReference,
  } from '@mathesar/components/file-attachments/fileUtils';
  import { lightboxContext } from '@mathesar/components/file-attachments/lightbox/LightboxController';
  import {
    assertExhaustive,
    getGloballyUniqueId,
    getLabelControllerFromContainingLabel,
    getLabelIdFromInputId,
  } from '@mathesar-component-library';

  const thumbnailResolutionHeightPx = 400;
  const labelController = getLabelControllerFromContainingLabel();
  const dispatch = createEventDispatcher();
  const lightbox = lightboxContext.get();
  const modalFileAttachmentUploader = modalFileAttachmentUploadContext.get();

  export let id = getGloballyUniqueId();
  export let value: unknown = undefined;
  let classes: string | undefined = '';
  export { classes as class };
  export let disabled = false;
  export let canUploadFile = true;
  export let fileManifest: FileManifest | undefined = undefined;
  export let setFileManifest:
    | ((mash: string, manifest: FileManifest) => void)
    | undefined = undefined;

  let element: HTMLSpanElement;

  $: hasValue = value !== undefined && value !== null && value !== '';
  $: labelController?.inputId.set(id);

  function updateCell(newValue: unknown) {
    value = newValue;
    dispatch('artificialChange', value);
    dispatch('artificialInput', value);
  }

  function clear() {
    value = null;
    dispatch('artificialChange', value);
    dispatch('artificialInput', value);
    if (lightbox) {
      lightbox.close();
    } else {
      // If the value is cleared via a button, the focus may shift to that button.
      // We'd like to shift it back to the input element to that the user can
      // press `Enter` to launch the record selector.
      element.focus();
    }
  }

  function openImageFileViewer({
    imageElement,
    zoomOrigin,
  }: {
    imageElement: HTMLImageElement;
    zoomOrigin?: DOMRect;
  }) {
    if (!fileManifest) return;
    if (!lightbox) return;
    lightbox.open({
      imageElement,
      zoomOrigin,
      fileManifest,
      removeFile: () => updateCell(null),
    });
  }

  function openFileViewer(manifest: FileManifest) {
    const viewerType = getFileViewerType(manifest);
    if (viewerType === 'image') {
      // TODO_FILES_UI: load image, find thumbnail in DOM. Also consider moving
      // loaded image cache up to this component.
      //
      // openImageFileViewer();
    } else if (viewerType === 'default') {
      // TODO_FILES_UI
    } else {
      assertExhaustive(viewerType);
    }
  }

  async function upload() {
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
            openFileViewer(fileManifest);
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
  <div class="file-input-content" class:filled={hasValue}>
    <FileCellContent
      {value}
      manifest={fileManifest}
      canOpenViewer={true}
      {thumbnailResolutionHeightPx}
      canUpload={canUploadFile && !disabled}
      {openImageFileViewer}
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
  .file-input-content.filled {
    height: 10em;
  }
</style>
