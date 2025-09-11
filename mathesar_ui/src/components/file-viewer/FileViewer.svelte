<script lang="ts">
  import type { FileManifest } from '@mathesar/api/rpc/records';
  import Button from '@mathesar/component-library/button/Button.svelte';
  import focusTrap from '@mathesar/component-library/common/actions/focusTrap';

  export let file: FileManifest;
  export let close: () => void = () => {};

  $: ({ mimetype } = file);
</script>

<div class="file-viewer" use:focusTrap>
  <div class="overlay"></div>
  <div class="content">
    {mimetype}
    <Button on:click={close}>Close</Button>
  </div>
</div>

<style>
  .file-viewer {
    position: fixed;
    inset: 0;
    z-index: var(--modal-z-index, auto);
    isolation: isolate;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .overlay {
    background-color: var(--modal-overlay);
    position: absolute;
    inset: 0;
    z-index: 1;
  }
  .content {
    z-index: 2;
  }
</style>
