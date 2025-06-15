<script lang="ts"></script>

<div class="grid-table" {...$$restProps}>
  <slot />
</div>

<style>
  .grid-table {
    display: grid;
    border: 1px solid var(--SYS-border-grid);
    border-radius: var(--border-radius-l);
    overflow: hidden;
    grid-template-columns: var(--Grid-table__template-columns);
    grid-template-rows: var(--Grid-table__template-rows);
    background: var(--SYS-surface-card);
    box-shadow:
      0 1px 2px var(--shadow-color-light),
      0 1px 3px var(--shadow-color);
  }
</style>
