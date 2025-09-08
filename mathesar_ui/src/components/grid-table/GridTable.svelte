<script lang="ts"></script>

<div class="grid-table" {...$$restProps}>
  <slot />
</div>

<style>
  .grid-table {
    display: grid;
    background: var(--surface-raised-1-background);
    border: 0.5px solid var(--surface-raised-1-border-color);
    border-radius: var(--border-radius-m);
    overflow: hidden;
    grid-template-columns: var(--Grid-table__template-columns);
    grid-template-rows: var(--Grid-table__template-rows, auto);
    box-shadow: 0 1px 4px var(--border-shadow);
  }
</style>
