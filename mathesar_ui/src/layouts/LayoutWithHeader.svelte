<script lang="ts">
  import AppHeader from '@mathesar/systems/app-header/AppHeader.svelte';

  export let fitViewport = false;
</script>

<div class="app-layout" class:fit-viewport={fitViewport}>
  <div class="app-layout-header">
    <AppHeader />
  </div>
  <main class="app-layout-content">
    <slot />
  </main>
</div>

<style>
  .app-layout {
    display: grid;
    grid-template: auto auto / 1fr;
  }
  .app-layout.fit-viewport {
    grid-template: auto 1fr / 1fr;
    height: 100vh;
  }
  .app-layout-content {
    position: relative;
  }
  .app-layout:not(.fit-viewport) .app-layout-content {
    padding: var(--page-padding);
  }
</style>
