<script lang="ts"></script>

<div class="grid-table" {...$$restProps}>
  <slot />
</div>

<style>
  .grid-table {
    display: grid;
    border: 0.5px solid var(--SYS-border-elevated-low);
    border-radius: var(--border-radius-m);
    overflow: hidden;
    grid-template-columns: var(--Grid-table__template-columns);
    grid-template-rows: 1fr auto;
    background: var(--SYS-surface-card);
    box-shadow:
      0 1px 2px var(--SYS-border-shadow),
      0 1px 3px var(--SYS-border-shadow);
  }
</style>
