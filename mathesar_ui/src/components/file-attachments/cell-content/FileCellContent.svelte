<script lang="ts">
  import type { FileManifest } from '@mathesar/api/rpc/records';
  import Default from '@mathesar/components/Default.svelte';
  import { iconAddNew } from '@mathesar/icons';
  import { Button, Icon } from '@mathesar-component-library';

  import FileCellValue from './AttachedFileReference.svelte';

  export let value: unknown = undefined;
  export let manifest: FileManifest | undefined = undefined;
  export let canOpenViewer: boolean;
  export let thumbnailResolutionHeightPx: number;
  export let canUpload: boolean;
  export let upload: () => void;
  export let remove: () => void;
  export let openImageFileViewer: (p: {
    imageElement: HTMLImageElement;
    zoomOrigin?: DOMRect;
  }) => void;

  $: hasValue = value !== undefined && value !== null;
</script>

<div class="file-cell-content">
  {#if hasValue}
    {#if manifest}
      <FileCellValue
        {manifest}
        {canOpenViewer}
        {thumbnailResolutionHeightPx}
        {openImageFileViewer}
        {remove}
      />
    {:else}
      <div class="centered">{value}</div>
    {/if}
  {:else if value === undefined}
    <div class="centered"><Default /></div>
  {:else}
    <div class="add">
      {#if canUpload}
        <Button on:click={upload}>
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
