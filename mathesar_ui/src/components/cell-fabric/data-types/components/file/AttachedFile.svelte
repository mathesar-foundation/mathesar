<script lang="ts">
  import type { FileManifest } from '@mathesar/api/rpc/records';
  import { ROW_HEIGHT_PX } from '@mathesar/geometry';

  const thumbnailHeight = ROW_HEIGHT_PX * 2;

  export let manifest: FileManifest;
  export let canOpen = false;
  export let open: () => void = () => {};

  $: ({ mimetype, uri, thumbnail } = manifest);
  $: mimeCategory = mimetype.split('/').at(0) ?? 'unknown';
  $: thumbnailUrl = `${thumbnail}?height=${thumbnailHeight}`;

  function handleClick() {
    if (!canOpen) return;
    open();
  }
</script>

<div class="attached-file" class:can-open={canOpen}>
  {#if mimeCategory === 'image'}
    <!-- TODO_FILES_UI: add a loading indicator -->
    <img alt={uri} src={thumbnailUrl} on:click={handleClick} />
  {:else}
    <!-- TODO_FILES_UI: we probably want to display a generic icon here instead -->
    {uri}
  {/if}
</div>

<style>
  .attached-file {
    height: 100%;
    overflow: hidden;
  }
  img {
    display: block;
    height: 100%;
    width: auto;
  }
  .attached-file.can-open img {
    cursor: pointer;
  }
</style>
