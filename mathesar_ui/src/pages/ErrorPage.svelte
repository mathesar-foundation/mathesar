<script lang="ts">
  import LayoutWithHeader from '@mathesar/layouts/LayoutWithHeader.svelte';
</script>

<LayoutWithHeader>
  <div class="error-page-container">
    <h1>Error</h1>
    <slot />
  </div>
</LayoutWithHeader>

<style>
  .error-page-container {
    margin-top: var(--size-x-large);
  }
</style>
