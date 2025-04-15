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
    color: inherit;
    font-weight: var(--font-weight-medium);
  }
  .breadcrumb-link:hover a {
    color: var(--accent-600);
  }
</style>
