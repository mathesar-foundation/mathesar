<!-- TODO: Rename it when the older LayoutWithHeader is deleted -->
<script lang="ts">
  import AppHeader from '@mathesar/components/AppHeader.svelte';

  export let fitViewport = false;
  export let maxWidth = true;
</script>

<div class="app-layout" class:fit-viewport={fitViewport}>
  <div class="app-layout-header">
    <AppHeader />
  </div>
  <slot name="secondary-header" />
  <main class="app-layout-content" class:max-width={maxWidth}>
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
  .app-layout-header {
    position: sticky;
  }
  .app-layout-content {
    position: relative;
  }
  .app-layout-content.max-width {
    max-width: var(--max-layout-width, 54rem);
    margin-left: auto;
    margin-right: auto;
    width: 100%;
  }
  .app-layout:not(.fit-viewport) .app-layout-content {
    padding: var(--page-padding);
  }
</style>
