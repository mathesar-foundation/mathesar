<script lang="ts">
  import FileViewer from './FileViewer.svelte';
  import type FileViewerController from './FileViewerController';

  export let controller: FileViewerController;

  $: file = $controller;
</script>

{#if file}
  <FileViewer
    {file}
    close={() => controller.close()}
    remove={() => controller.removeFile()}
  />
{/if}
