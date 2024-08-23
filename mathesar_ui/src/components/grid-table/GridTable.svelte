<div class="grid-table" {...$$restProps}>
  <slot />
</div>

<style>
  .grid-table {
    --Grid-table__border-size-internal: var(--Grid-table__border-size, 1px);
    --Grid-table__border-color-internal: var(
      --Grid-table__border-color,
      var(--slate-300)
    );
    --Grid-table__cell-border-color-internal: var(
      --Grid-table__cell-border-color,
      var(--slate-200)
    );
    display: grid;
    border: var(--Grid-table__border-size-internal) solid
      var(--Grid-table__border-color-internal);
    border-radius: var(--border-radius-l);
    overflow: hidden;
    grid-template-columns: var(--Grid-table__template-columns);
    grid-template-rows: var(--Grid-table__template-rows);
  }
</style>
