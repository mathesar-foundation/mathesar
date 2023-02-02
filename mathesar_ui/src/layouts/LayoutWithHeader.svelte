<script lang="ts">
  import AppHeader from '@mathesar/components/AppHeader.svelte';
  import LiveDemoBanner from '@mathesar/components/LiveDemoBanner.svelte';
  import { createStyleString } from '@mathesar/utils/styles';

  export let fitViewport = false;
  export let restrictWidth = false;
  export let cssVariables: Record<string, string> | undefined = undefined;

  $: style = cssVariables ? createStyleString(cssVariables) : undefined;
</script>

<div class="app-layout" class:fit-viewport={fitViewport} {style}>
  <LiveDemoBanner />
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
    height: 100%;
    display: flex;
    flex-direction: column;
    background-color: var(--layout-background-color, transparent);

    .app-layout-header {
      position: sticky;
      top: 0;
      z-index: var(--app-header-z-index, 2);
      flex: 0 0;
    }
    .app-layout-content {
      position: relative;
      flex-grow: 1;

      &.restrict-width {
        max-width: var(--max-layout-width, 54rem);
        margin-left: auto;
        margin-right: auto;
        width: 100%;
      }
    }

    &:not(.fit-viewport) {
      overflow: auto;
    }
    &.fit-viewport {
      overflow: hidden;

      .app-layout-content {
        overflow: hidden;
      }
    }
  }

  // TODO: Remove default styling properties on layout components
  .app-layout:not(.fit-viewport) .app-layout-content {
    padding: 0 var(--page-padding);
  }
</style>
