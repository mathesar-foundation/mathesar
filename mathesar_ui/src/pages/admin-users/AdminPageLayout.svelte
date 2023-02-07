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

<div class="admin-layout" {style}>
  <aside>
    <slot name="sidebar" />
  </aside>
  <main>
    <slot />
  </main>
</div>

<style lang="scss">
  .admin-layout {
    display: flex;
    flex-wrap: wrap;
    max-width: var(--max-layout-width, 85rem);
    margin-left: auto;
    margin-right: auto;
    padding: 1rem 0;

    > :global(* + *) {
      margin-left: 1rem;
    }
  }

  aside {
    flex-grow: 1;
    flex-basis: 18rem;

    border-right: 1px solid var(--slate-200);
    // background-color: yellow;
  }

  main {
    flex-basis: 0;
    flex-grow: 999;
    min-inline-size: 50%;

    // background-color: red;
  }
</style>
