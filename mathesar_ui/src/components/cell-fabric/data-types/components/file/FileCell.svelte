<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  import type { FileManifest } from '@mathesar/api/rpc/records';
  import FileCellContent from '@mathesar/components/file-attachments/cell-content/FileCellContent.svelte';
  import { ROW_HEIGHT_PX } from '@mathesar/geometry';
  import { oneWayMessageChannel } from '@mathesar/utils/OneWayMessageChannel';

  import CellWrapper from '../CellWrapper.svelte';

  /** Using 2x to look good on high DPI displays */
  const thumbnailResolutionHeightPx = ROW_HEIGHT_PX * 2;
  const dispatch = createEventDispatcher();
  const [openFileViewer, onOpenFileViewer] = oneWayMessageChannel();

  export let fileManifest: FileManifest | undefined = undefined;
  export let isActive: boolean;
  export let value: unknown = undefined;
  export let disabled: boolean;
  export let isIndependentOfSheet: boolean;

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

  function updateCell() {
    // TODO_FILES_UI: implement
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
    {#if fileManifest}
      <FileCellContent
        {value}
        manifest={fileManifest}
        {updateCell}
        canOpenViewer={isActive}
        onParentTriggersFileViewer={onOpenFileViewer}
        {thumbnailResolutionHeightPx}
        canUpload={isActive && !disabled}
      />
    {:else}
      <!-- TODO_FILES_UI: handle this failure scenario -->
    {/if}
  </div>
</CellWrapper>

<style>
  .file-cell {
    display: grid;
    overflow: hidden;
    padding: 1px;
  }
</style>
