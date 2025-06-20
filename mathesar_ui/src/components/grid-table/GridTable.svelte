<script lang="ts"></script>

<div class="grid-table" {...$$restProps}>
  <slot />
</div>

<style>
  .grid-table {
    display: grid;
    border: 0.5px solid var(--border-elevated-low);
    border-radius: var(--border-radius-m);
    overflow: hidden;
    grid-template-columns: var(--Grid-table__template-columns);
    grid-template-rows: 1fr auto;
    background: var(--surface-card);
    box-shadow:
      0 1px 2px var(--border-shadow),
      0 1px 3px var(--border-shadow);
  }
</style>
