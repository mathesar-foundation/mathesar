<script lang="ts">
  import { iconAddNew } from '@mathesar/icons';
  import { Button, Icon } from '@mathesar-component-library';

  import AttachedFileReference from './AttachedFileReference.svelte';
  import type { FileViewerController } from './FileViewerController';

  export let value: unknown = undefined;
  export let thumbnailResolutionHeightPx: number;
  export let showUploadButton = true;
  export let canUpload: boolean;
  export let upload: () => void;
  export let fileViewerController: FileViewerController | undefined;

  $: hasValue = value !== undefined && value !== null;
</script>

<div class="file-cell-content">
  {#if hasValue}
    {#if fileViewerController}
      <AttachedFileReference
        {fileViewerController}
        {thumbnailResolutionHeightPx}
      />
    {:else}
      <div class="centered">{value}</div>
    {/if}
  {:else}
    <div class="add">
      {#if showUploadButton}
        <Button disabled={!canUpload} on:click={upload} tabindex="-1">
          <Icon {...iconAddNew} />
        </Button>
      {/if}
    </div>
  {/if}
</div>

<style>
  .file-cell-content {
    display: grid;
    overflow: hidden;
    height: 100%;
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
