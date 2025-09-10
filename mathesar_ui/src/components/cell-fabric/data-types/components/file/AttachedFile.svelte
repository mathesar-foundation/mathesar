<script lang="ts">
  import type { FileManifest } from '@mathesar/api/rpc/records';
  import { ROW_HEIGHT_PX } from '@mathesar/geometry';

  const thumbnailHeight = ROW_HEIGHT_PX * 2;

  export let manifest: FileManifest;

  $: ({ mimetype, uri, thumbnail } = manifest);
  $: mimeCategory = mimetype.split('/').at(0) ?? 'unknown';
  $: thumbnailUrl = `${thumbnail}?height=${thumbnailHeight}`;
</script>

{#if mimeCategory === 'image'}
  <!-- TODO_FILES_UI: loading indicator -->
  <img alt="" src={thumbnailUrl} height={ROW_HEIGHT_PX} />
{:else}
  <!-- TODO_FILES_UI: we probably want to display a generic icon here instead -->
  {uri}
{/if}
