<script lang="ts">
  export let href: string;
</script>

<span class="breadcrumb-item">
  <a {href}><slot /></a>
</span>

<style>
  .breadcrumb-item {
    display: block;
  }
  .breadcrumb-item a {
    display: block;
    text-decoration: none;
    color: var(--color-gray-darker);
    font-weight: 500;
    font-size: var(--text-size-base);
  }
  .breadcrumb-item a:hover {
    text-decoration: underline;
    border-color: #555;
  }
</style>
