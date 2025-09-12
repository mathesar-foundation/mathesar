<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  import type { FileManifest } from '@mathesar/api/rpc/records';
  import Default from '@mathesar/components/Default.svelte';
  import { fileViewerContext } from '@mathesar/components/file-attachments/file-viewer/FileViewerContext';
  import { ROW_HEIGHT_PX } from '@mathesar/geometry';
  import { iconAddNew } from '@mathesar/icons';
  import { Button, Icon } from '@mathesar-component-library';

  import CellWrapper from '../CellWrapper.svelte';

  import AttachedFile from './AttachedFile.svelte';

  const dispatch = createEventDispatcher();
  const fileViewer = fileViewerContext.get();

  export let fileManifest: FileManifest | undefined = undefined;
  export let isActive: boolean;
  export let value: unknown = undefined;
  export let disabled: boolean;
  export let isIndependentOfSheet: boolean;

  let cellWrapperElement: HTMLElement;

  $: hasValue = value !== undefined && value !== null;
  $: canOpen = isActive;

  function removeFileFromCell() {
    // TODO_FILES_UI: implement
  }

  function openFileViewer() {
    // TODO_FILES_UI: Fix click behavior. Clicking on the thumbnail of an
    // inactive cell should _not_ open the file viewer.

    if (!fileManifest) return;
    if (!canOpen) return;
    if (!fileViewer) return;
    fileViewer.open(fileManifest, { removeFile: removeFileFromCell });
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

  function upload() {
    // TODO_FILES_UI
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
  bind:element={cellWrapperElement}
>
  <div class="file-cell" class:disabled style={`height: ${ROW_HEIGHT_PX}px;`}>
    {#if hasValue}
      {#if fileManifest}
        <AttachedFile manifest={fileManifest} {canOpen} open={openFileViewer} />
      {:else}
        {value}
      {/if}
    {:else if value === undefined}
      <div class="centered">
        <Default />
      </div>
    {:else}
      <div class="add">
        {#if isActive}
          <Button on:click={upload}>
            <Icon {...iconAddNew} />
          </Button>
        {/if}
      </div>
    {/if}
  </div>
</CellWrapper>

<style>
  .file-cell {
    display: grid;
    overflow: hidden;
    padding: 1px;
  }
  .centered {
    display: grid;
    align-items: center;
    justify-content: start;
    padding-inline: var(--cell-padding);
  }
  .add {
    display: grid;
    align-items: center;
    justify-content: end;
    padding-inline: var(--cell-padding);
  }
</style>
