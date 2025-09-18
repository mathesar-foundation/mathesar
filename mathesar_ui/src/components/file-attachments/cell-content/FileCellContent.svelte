<script lang="ts">
  import type { FileManifest } from '@mathesar/api/rpc/records';
  import { iconAddNew } from '@mathesar/icons';
  import { Button, Icon } from '@mathesar-component-library';

  import AttachedFileReference from './AttachedFileReference.svelte';

  export let value: unknown = undefined;
  export let manifest: FileManifest | undefined = undefined;
  export let canOpenViewer: boolean;
  export let thumbnailResolutionHeightPx: number;
  export let canUpload: boolean;
  export let upload: () => void;
  export let openImageFileViewer: (p: {
    imageElement: HTMLImageElement;
    zoomOrigin?: DOMRect;
  }) => void;
  export let openFileDetailDropdown: (p: { trigger: HTMLElement }) => void;

  $: hasValue = value !== undefined && value !== null;
</script>

<div class="file-cell-content">
  {#if hasValue}
    {#if manifest}
      <AttachedFileReference
        {manifest}
        {canOpenViewer}
        {thumbnailResolutionHeightPx}
        {openImageFileViewer}
        {openFileDetailDropdown}
      />
    {:else}
      <div class="centered">{value}</div>
    {/if}
  {:else}
    <div class="add">
      {#if canUpload}
        <Button on:click={upload} tabindex="-1">
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
