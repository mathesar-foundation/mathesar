<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  import type { FileManifest } from '@mathesar/api/rpc/records';
  import FileCellContent from '@mathesar/components/file-attachments/cell-content/FileCellContent.svelte';
  import { getFileViewerType } from '@mathesar/components/file-attachments/fileUtils';
  import { lightboxContext } from '@mathesar/components/file-attachments/lightbox/LightboxController';
  import { ROW_HEIGHT_PX } from '@mathesar/geometry';

  import CellWrapper from '../CellWrapper.svelte';

  /** Using 2x to look good on high DPI displays */
  const thumbnailResolutionHeightPx = ROW_HEIGHT_PX * 2;
  const dispatch = createEventDispatcher();
  const lightbox = lightboxContext.get();

  export let fileManifest: FileManifest | undefined = undefined;
  export let isActive: boolean;
  export let value: unknown = undefined;
  export let disabled: boolean;
  export let isIndependentOfSheet: boolean;

  function updateCell(newValue: unknown) {
    // TODO_FILES_UI: implement
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

  function openFileViewer() {
    if (!fileManifest) return;
    const viewerType = getFileViewerType(fileManifest);
    // TODO_FILES_UI: finish
  }

  function handleWrapperKeyDown(e: KeyboardEvent) {
    switch (e.key) {
      case 'Enter':
        openFileViewer();
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
  <div class="file-cell" class:disabled style={`height: ${ROW_HEIGHT_PX}px;`}>
    <FileCellContent
      {value}
      manifest={fileManifest}
      {updateCell}
      canOpenViewer={isActive}
      {thumbnailResolutionHeightPx}
      canUpload={isActive && !disabled}
      {openImageFileViewer}
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
