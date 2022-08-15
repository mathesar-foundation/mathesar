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
    color: #000;
    text-decoration: none;
    font-size: 1.3rem;
    padding: 0.2em 0.5em;
    background: white;
    border: solid 1px #bbb;
    border-radius: 0.2em;
  }
  .breadcrumb-item a:hover {
    text-decoration: underline;
    border-color: #555;
  }
</style>
