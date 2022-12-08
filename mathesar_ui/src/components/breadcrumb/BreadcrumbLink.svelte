<script lang="ts">
  export let href: string;
</script>

<span class="breadcrumb-link">
  <a {href}><slot /></a>
</span>

<style>
  .breadcrumb-link {
    display: block;
    overflow: hidden;
  }
  .breadcrumb-link a {
    display: block;
    overflow: hidden;
    text-decoration: none;
    color: inherit;
    font-weight: 500;
    font-size: var(--text-size-base);
  }
  .breadcrumb-link a:hover {
    text-decoration: underline;
    border-color: #555;
  }
</style>
