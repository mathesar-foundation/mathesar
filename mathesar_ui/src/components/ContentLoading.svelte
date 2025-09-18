<script lang="ts">
  import Spinner from '@mathesar/component-library/spinner/Spinner.svelte';

  export let loading = false;
</script>

<div class="content-loading-indicator" class:loading>
  <slot />
  <div class="indicator">
    <div class="overlay"></div>
    <Spinner />
  </div>
</div>

<style>
  .content-loading-indicator {
    position: relative;
    overflow: hidden;
    height: var(--ContentLoading__height);
  }
  .content-loading-indicator:not(.loading) .indicator {
    display: none;
  }
  .indicator {
    position: absolute;
    inset: 0;
    display: grid;
    align-items: center;
    justify-content: center;
    font-size: 1.3rem;
  }
  .overlay {
    position: absolute;
    inset: 0;
    background: var(--color-loading-overlay);
  }
</style>
