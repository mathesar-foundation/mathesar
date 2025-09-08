<script lang="ts"></script>

<div class="grid-table" {...$$restProps}>
  <slot />
</div>

<style>
  .grid-table {
    display: grid;
    background: var(--color-surface-raised-1);
    border: 0.5px solid var(--color-surface-raised-1-border);
    border-radius: var(--border-radius-m);
    overflow: hidden;
    grid-template-columns: var(--Grid-table__template-columns);
    grid-template-rows: var(--Grid-table__template-rows, auto);
    box-shadow: 0 1px 4px var(--color-shadow);
  }
</style>
