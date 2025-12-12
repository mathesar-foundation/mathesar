<script lang="ts">
  // TODO: Rename this component to something that represents layout for top-level page
  import AppHeader from '@mathesar/components/AppHeader.svelte';
  import { preloadCommonData } from '@mathesar/utils/preloadData';
  import { makeStyleStringFromCssVariables } from '@mathesar-component-library';
  import type { CssVariablesObj } from '@mathesar-component-library/types';

  const commonData = preloadCommonData();
  const showHeader = commonData.routing_context !== 'anonymous';

  export let fitViewport = false;
  export let restrictWidth = false;
  export let cssVariables: CssVariablesObj | undefined = undefined;

  $: style = cssVariables
    ? makeStyleStringFromCssVariables(cssVariables)
    : undefined;
</script>

<div class="app-layout" class:fit-viewport={fitViewport} {style}>
  {#if showHeader}
    <div class="app-layout-header">
      <AppHeader />
    </div>
    <slot name="secondary-header" />
  {/if}
  <main class="app-layout-content" class:restrict-width={restrictWidth}>
    <slot />
  </main>
</div>

<style lang="scss">
  .app-layout {
    height: 100%;
    display: flex;
    flex-direction: column;
    background-color: var(--color-bg-base);
    color: var(--color-fg-base);

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
        max-width: var(--max-layout-width);
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

  .app-layout:not(.fit-viewport) .app-layout-content {
    padding: var(--page-padding);
  }
</style>
