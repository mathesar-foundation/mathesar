<script lang="ts">
  export let href: string;
</script>

<span class="breadcrumb-link">
  <a {href}><slot /></a>
</span>

<style lang="scss">
  .breadcrumb-link {
    display: block;
    overflow: hidden;
    padding: var(--sm5);
  }
  .breadcrumb-link a {
    display: block;
    overflow: hidden;
    text-decoration: none;
    color: var(--color-fg-navigation);
    font-weight: var(--font-weight-medium);
  }
  .breadcrumb-link:hover a {
    color: var(--color-fg-navigation-hover);
  }
  .breadcrumb-link:has(a:focus) {
    color: var(--color-fg-navigation-focused);
    box-shadow: inset 0 0 2px 1px var(--color-shadow);
    border-radius: var(--border-radius-m);
  }
</style>
