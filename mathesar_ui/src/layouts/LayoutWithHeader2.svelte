<!-- TODO: Rename it when the older LayoutWithHeader is deleted -->
<script lang="ts">
  import AppHeader from '@mathesar/components/AppHeader.svelte';

  export let fitViewport = false;
  export let restrictWidth = true;
</script>

<div class="app-layout" class:fit-viewport={fitViewport}>
  <div class="app-layout-header">
    <AppHeader />
  </div>
  <slot name="secondary-header" />
  <main class="app-layout-content" class:restrict-width={restrictWidth}>
    <slot />
  </main>
</div>

<style lang="scss">
  .app-layout {
    display: grid;
    grid-template: auto auto / 1fr;

    .app-layout-header {
      position: sticky;
    }
    .app-layout-content {
      position: relative;

      &.restrict-width {
        max-width: var(--max-layout-width, 54rem);
        margin-left: auto;
        margin-right: auto;
        width: 100%;
      }
    }

    &.fit-viewport {
      grid-template: auto 1fr / 1fr;
      height: 100vh;
      overflow: hidden;

      .app-layout-content {
        overflow: hidden;
      }
    }
  }

  // TODO: Remove default styling properties on layout components
  .app-layout:not(.fit-viewport) .app-layout-content {
    padding: var(--page-padding);
  }
</style>
