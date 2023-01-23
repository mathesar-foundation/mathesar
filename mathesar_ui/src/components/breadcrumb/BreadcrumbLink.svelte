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
    transition: background-color 0.2s ease-in-out;
    &:hover {
      background-color: var(--slate-600);
    }
  }
  .breadcrumb-link a {
    display: block;
    overflow: hidden;
    text-decoration: none;
    color: inherit;
    font-weight: 500;
    font-size: var(--text-size-base);
  }
</style>
