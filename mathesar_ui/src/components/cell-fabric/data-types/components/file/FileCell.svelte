<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { _ } from 'svelte-i18n';

  import type { FileManifest } from '@mathesar/api/rpc/records';
  import Default from '@mathesar/components/Default.svelte';
  import { Button, Icon } from '@mathesar-component-library';

  import CellWrapper from '../CellWrapper.svelte';

  import AttachedFile from './AttachedFile.svelte';
  import { ROW_HEIGHT_PX } from '@mathesar/geometry';
  import { iconAddNew } from '@mathesar/icons';

  const dispatch = createEventDispatcher();

  export let fileManifest: FileManifest | undefined = undefined;
  export let isActive: boolean;
  export let value: unknown = undefined;
  export let disabled: boolean;
  export let isIndependentOfSheet: boolean;

  let cellWrapperElement: HTMLElement;

  $: hasValue = value !== undefined && value !== null;

  function handleWrapperKeyDown(e: KeyboardEvent) {
    switch (e.key) {
      case 'Enter':
        if (isActive) {
          // TODO_FILES_UI: open file viewer
        }
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
        <AttachedFile manifest={fileManifest} canOpen={isActive} />
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
