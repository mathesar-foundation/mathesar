<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  import type { FileManifest } from '@mathesar/api/rpc/records';
  import FileCellContent from '@mathesar/components/file-attachments/cell-content/FileCellContent.svelte';
  import { FileViewerController } from '@mathesar/components/file-attachments/cell-content/FileViewerController';
  import { fileDetailDropdownContext } from '@mathesar/components/file-attachments/file-detail-dropdown/FileDetailDropdownController';
  import { modalFileAttachmentUploadContext } from '@mathesar/components/file-attachments/file-uploader/modalFileAttachmentUploadContext';
  import FileDetail from '@mathesar/components/file-attachments/FileDetail.svelte';
  import { parseFileReference } from '@mathesar/components/file-attachments/fileUtils';
  import { lightboxContext } from '@mathesar/components/file-attachments/lightbox/LightboxController';
  import { ROW_HEIGHT_PX } from '@mathesar/geometry';

  import CellWrapper from '../CellWrapper.svelte';

  /** Using 2x to look good on high DPI displays */
  const thumbnailResolutionHeightPx = ROW_HEIGHT_PX * 2;
  const dispatch = createEventDispatcher();
  const lightboxController = lightboxContext.get();
  const fileDetailController = fileDetailDropdownContext.get();
  const modalFileAttachmentUploader = modalFileAttachmentUploadContext.get();

  export let fileManifest: FileManifest | undefined = undefined;
  export let isActive: boolean;
  export let value: unknown = undefined;
  export let disabled: boolean;
  export let isIndependentOfSheet: boolean;
  export let setFileManifest:
    | ((mash: string, manifest: FileManifest) => void)
    | undefined = undefined;

  let cellWrapperElement: HTMLElement;

  function updateCell(newValue: unknown) {
    value = newValue;
    dispatch('update', { value });
  }

  $: fileViewerController = fileManifest
    ? new FileViewerController({
        manifest: fileManifest,
        removeFile: () => updateCell(null),
        lightboxController,
        fileDetailController,
        onClose: async () => {
          cellWrapperElement?.focus();
        },
      })
    : undefined;
  $: fileViewerController?.canOpenViewer.set(isActive);

  async function upload() {
    if (disabled) return; // Disallow uploads on read-only cells
    if (!modalFileAttachmentUploader) return;
    const attachment =
      await modalFileAttachmentUploader.acquireFileAttachment();
    if (!attachment) return;
    const fileReference = parseFileReference(attachment.result);
    if (!fileReference) return;
    updateCell(attachment.result);
    setFileManifest?.(fileReference.mash, attachment.download_link);
  }

  async function viewOrUpload() {
    if (fileManifest) {
      await fileViewerController?.openFileViewer();
    } else {
      await upload();
    }
  }

  function handleWrapperKeyDown(e: KeyboardEvent) {
    switch (e.key) {
      case 'Enter':
        void viewOrUpload();
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
</script>

<CellWrapper
  {isActive}
  {disabled}
  {isIndependentOfSheet}
  on:mouseenter
  on:keydown={handleWrapperKeyDown}
  on:dblclick={viewOrUpload}
  hasPadding={false}
  bind:element={cellWrapperElement}
>
  <div
    class="file-cell"
    class:disabled
    class:independent={isIndependentOfSheet}
    style={isIndependentOfSheet ? '' : `height: ${ROW_HEIGHT_PX}px;`}
  >
    <FileCellContent
      {value}
      {fileViewerController}
      {thumbnailResolutionHeightPx}
      canUpload={isActive && !disabled}
      {upload}
    />
    {#if isIndependentOfSheet && fileManifest}
      <FileDetail {fileManifest} />
    {/if}
  </div>
</CellWrapper>

<style lang="scss">
  .file-cell {
    display: grid;
    overflow: hidden;
    padding: 1px;
  }
</style>
