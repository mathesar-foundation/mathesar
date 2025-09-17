<script lang="ts">
  import Lightbox from './Lightbox.svelte';
  import type { LightboxController } from './LightboxController';

  export let controller: LightboxController;

  $: props = $controller;
</script>

{#if props}
  <Lightbox close={() => controller.close()} {...props} />
{/if}
