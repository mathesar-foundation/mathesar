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
    padding: 0.25rem 0.5rem;
    border-radius: 0.25rem;
    transition: color 0.2s ease-in-out;
  }
  .breadcrumb-link a {
    display: block;
    overflow: hidden;
    text-decoration: none;
    color: inherit;
    font-weight: 500;
    font-size: var(--text-size-base);
    transition: color 0.2s ease-in-out;
  }
  .breadcrumb-link:hover a {
    color: var(--accent-600);
  }
</style>
