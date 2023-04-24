<script lang="ts">
  import { makeStyleStringFromCssVariables } from '@mathesar-component-library';

  export let cssVariables: Record<string, string> | undefined = undefined;

  $: style = cssVariables
    ? makeStyleStringFromCssVariables(cssVariables)
    : undefined;
</script>

<div class="page-sidebar-layout" {style}>
  <aside>
    <slot name="sidebar" />
  </aside>
  <main>
    <slot />
  </main>
</div>

<style lang="scss">
  .page-sidebar-layout {
    --PageLayoutWithSidebar__gap: 1rem;
    display: flex;
    flex-wrap: wrap;
    margin-left: calc(-1 * var(--PageLayoutWithSidebar__gap));

    aside {
      flex-grow: 1;
      flex-basis: var(--PageLayoutWithSidebar__sidebar-width, 14rem);
      margin-left: var(--PageLayoutWithSidebar__gap);
    }

    main {
      flex-basis: 0;
      flex-grow: 999;
      min-inline-size: 65%;
      margin-left: var(--PageLayoutWithSidebar__gap);
    }
  }
</style>
