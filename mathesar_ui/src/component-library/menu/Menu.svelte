<script lang="ts">
</script>

<div class="menu">
  <slot />
</div>

<style>
  .menu {
    display: inline-grid;
    grid-template: 1fr / auto auto auto;
  }
</style>
