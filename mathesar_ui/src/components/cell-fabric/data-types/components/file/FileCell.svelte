<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { _ } from 'svelte-i18n';

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

  function remove() {
    updateCell(null);
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
      removeFile: () => remove(),
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

  function handleWrapperKeyDown(e: KeyboardEvent) {
    switch (e.key) {
      case 'Enter':
        if (fileManifest) {
          openFileViewer(fileManifest);
        } else {
          void upload();
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
  <div
    class="file-cell"
    class:disabled
    class:independent={isIndependentOfSheet}
    style={isIndependentOfSheet ? '' : `height: ${ROW_HEIGHT_PX}px;`}
  >
    <FileCellContent
      {value}
      manifest={fileManifest}
      canOpenViewer={isActive}
      {thumbnailResolutionHeightPx}
      canUpload={isActive && !disabled}
      {openImageFileViewer}
      {upload}
      {remove}
    />
    {#if isIndependentOfSheet && fileManifest}
      <table>
        <tr><th>{$_('storage_uri')}</th><td>{fileManifest.uri}</td></tr>
        <tr><th>{$_('mime_type')}</th><td>{fileManifest.mimetype}</td></tr>
      </table>
    {/if}
  </div>
</CellWrapper>

<style lang="scss">
  .file-cell {
    display: grid;
    overflow: hidden;
    padding: 1px;
  }

  table {
    padding: var(--sm4);
    max-width: max-content;

    th {
      text-align: left;
      min-width: max-content;
      white-space: nowrap;
      vertical-align: top;
    }
    td {
      line-height: 1.2;
      padding: 0.2em 0.8em;
    }
  }
</style>
