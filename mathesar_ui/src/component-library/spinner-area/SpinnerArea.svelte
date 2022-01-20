<script lang="ts">
  import Spinner from '@mathesar-component-library-dir/spinner/Spinner.svelte';

  export let isSpinning = false;
  export let hasOverlay = true;
</script>

<div class="spinner-area" class:has-overlay={hasOverlay}>
  <slot />
  {#if isSpinning}
    <div class="facade">
      {#if hasOverlay}
        <div class="overlay" />
      {/if}
      <Spinner />
    </div>
  {/if}
</div>
