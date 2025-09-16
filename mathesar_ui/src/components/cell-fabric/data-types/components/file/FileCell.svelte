<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  import type { FileManifest } from '@mathesar/api/rpc/records';
  import FileCellContent from '@mathesar/components/file-attachments/cell-content/FileCellContent.svelte';
  import { modalFileAttachmentUploadContext } from '@mathesar/components/file-attachments/file-uploader/modalFileAttachmentUploadContext';
  import {
    getFileViewerType,
    parseFileReference,
  } from '@mathesar/components/file-attachments/fileUtils';
  import { lightboxContext } from '@mathesar/components/file-attachments/lightbox/LightboxController';
  import { ROW_HEIGHT_PX } from '@mathesar/geometry';
  import { assertExhaustive } from '@mathesar-component-library';

  import CellWrapper from '../CellWrapper.svelte';

  /** Using 2x to look good on high DPI displays */
  const thumbnailResolutionHeightPx = ROW_HEIGHT_PX * 2;
  const dispatch = createEventDispatcher();
  const lightbox = lightboxContext.get();
  const modalFileAttachmentUploader = modalFileAttachmentUploadContext.get();

  export let fileManifest: FileManifest | undefined = undefined;
  export let isActive: boolean;
  export let value: unknown = undefined;
  export let disabled: boolean;
  export let isIndependentOfSheet: boolean;
  export let setFileManifest:
    | ((mash: string, manifest: FileManifest) => void)
    | undefined = undefined;

  function updateCell(newValue: unknown) {
    value = newValue;
    dispatch('update', { value });
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

  function handleWrapperKeyDown(e: KeyboardEvent) {
    switch (e.key) {
      case 'Enter':
        if (fileManifest) {
          openFileViewer(fileManifest);
        } else {
          upload();
        }
        // TODO_FILES_UI: why doesn't this work?
        break;
      case 'Tab':
      case 'ArrowLeft':
      case 'ArrowRight':
      case 'ArrowDown':
      case 'ArrowUp':
        dispatch('movementKeyDown', {
          originalEvent: e,
          key: e.key,
        });
        break;
      default:
        break;
    }
  }

  function handleMouseDown() {
    dispatch('activate');
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
</script>

<CellWrapper
  {isActive}
  {disabled}
  {isIndependentOfSheet}
  on:mouseenter
  on:keydown={handleWrapperKeyDown}
  on:mousedown={handleMouseDown}
  hasPadding={false}
>
  <div class="file-cell" class:disabled style={`height: ${ROW_HEIGHT_PX}px;`}>
    <FileCellContent
      {value}
      manifest={fileManifest}
      {updateCell}
      canOpenViewer={isActive}
      {thumbnailResolutionHeightPx}
      canUpload={isActive && !disabled}
      {openImageFileViewer}
      {upload}
    />
  </div>
</CellWrapper>

<style>
  .file-cell {
    display: grid;
    overflow: hidden;
    padding: 1px;
  }
</style>
