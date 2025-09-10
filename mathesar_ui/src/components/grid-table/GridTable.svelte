<script lang="ts"></script>

<div class="grid-table" {...$$restProps}>
  <slot />
</div>

<style>
  .grid-table {
    display: grid;
    background: var(--color-surface-raised-1);
    border: 0.5px solid var(--color-surface-raised-1-border);
    border-radius: var(--border-radius-l);
    overflow: hidden;
    grid-template-columns: var(--Grid-table__template-columns);
    grid-template-rows: var(--Grid-table__template-rows, auto);
  }
</style>
