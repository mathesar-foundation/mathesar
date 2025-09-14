<script lang="ts">
  import Lightbox from './Lightbox.svelte';
  import type { LightboxController } from './LightboxController';

  export let controller: LightboxController;

  $: file = $controller;
</script>

{#if file}
  <Lightbox
    {file}
    close={() => controller.close()}
    remove={() => controller.removeFile()}
  />
{/if}
