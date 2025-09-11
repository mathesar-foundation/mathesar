<script lang="ts">
  import type { FileManifest } from '@mathesar/api/rpc/records';
  import ImageFileViewer from './ImageFileViewer.svelte';

  export let file: FileManifest;
  export let close: () => void = () => {};

  $: mimeCategory = file.mimetype.split('/').at(0) ?? 'unknown';

  // TODO_FILES_UI: handle other file types
</script>

{#if mimeCategory === 'image'}
  <ImageFileViewer {file} {close} />
{/if}
