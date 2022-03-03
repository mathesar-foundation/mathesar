<script lang="ts">
</script>

<div class="menu">
  <slot />
</div>

<style>
  .menu {
    --spacing-x: 0.4em;
    --spacing-y: 0.4em;
    display: inline-grid;
    min-width: var(--min-width, 0);
    grid-template-columns:
      [spacer-left] var(--spacing-x)
      [control] auto
      [icon] auto
      [label] 1fr
      [spacer-right] var(--spacing-x);
    padding: var(--spacing-y) 0;
  }
</style>
