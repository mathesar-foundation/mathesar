<script lang="ts"></script>

<div class="grid-table" {...$$restProps}>
  <slot />
</div>

<style>
  .grid-table {
    --Grid-table__border-size-internal: var(--Grid-table__border-size, 1px);
    --Grid-table__border-color-internal: var(
      --Grid-table__border-color,
      var(--card-border)
    );
    --Grid-table__cell-border-color-internal: var(
      --Grid-table__cell-border-color,
      var(--card-row-border)
    );
    display: grid;
    border: var(--Grid-table__border-size-internal) solid
      var(--Grid-table__border-color-internal);
    border-radius: var(--border-radius-l);
    overflow: hidden;
    grid-template-columns: var(--Grid-table__template-columns);
    grid-template-rows: var(--Grid-table__template-rows);
    background-color: var(--card-background);
  }
</style>
