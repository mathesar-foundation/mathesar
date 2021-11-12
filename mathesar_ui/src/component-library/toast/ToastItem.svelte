<script lang="ts">
  import type { ToastEntry } from './ToastController';
  
  export let entry: ToastEntry;

  $: ({ props, controller } = entry);
  $: ({ progress, dismiss } = controller);
  $: ({ pause, resume } = progress);
</script>

<div class="toast-item" on:mouseenter={pause} on:mouseleave={resume}>
  <div class="message">
    {props.message}
  </div>
  {#if props.allowDismiss}
    <div class="close-button pe" role="button" tabindex="-1" on:click={dismiss}>✕</div>
  {/if}
  <progress value={$progress} />
</div>
  
<style global lang="scss">
  @import "ToastItem.scss";
</style>
