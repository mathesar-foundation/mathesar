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
  }
  .breadcrumb-link a {
    display: block;
    overflow: hidden;
    text-decoration: none;
    color: var(--color-fg-navigation);
    font-weight: var(--font-weight-medium);
  }
  .breadcrumb-link:hover a {
    color: var(--color-fg-navigation-active);
  }
</style>
