<script lang="ts">
  export let cssVariables: Record<string, string> | undefined = undefined;

  // TODO: Refactor this once #2409 is merged
  $: style = cssVariables
    ? Object.entries(cssVariables)
        .filter((val) => val[0].indexOf('--') === 0)
        .map((entry) => `${entry[0]}: ${entry[1]}`)
        .join(';')
    : undefined;
</script>

<div class="admin-layout-container" {style}>
  <div class="admin-layout">
    <aside>
      <slot name="sidebar" />
    </aside>
    <main>
      <slot />
    </main>
  </div>
</div>

<style lang="scss">
  .admin-layout-container {
    max-width: var(--max-layout-width, 85rem);
    margin-left: auto;
    margin-right: auto;
    padding: 1rem 0;
  }

  .admin-layout {
    --gap: 1rem;
    display: flex;
    flex-wrap: wrap;
    margin-left: calc(-1 * var(--gap));

    aside {
      flex-grow: 1;
      flex-basis: 18rem;
      margin-left: var(--gap);
    }

    main {
      flex-basis: 0;
      flex-grow: 999;
      min-inline-size: 50%;
      margin-left: var(--gap);
    }
  }
</style>
