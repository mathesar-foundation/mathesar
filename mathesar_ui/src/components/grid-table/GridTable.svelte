<script lang="ts"></script>

<div class="grid-table" {...$$restProps}>
  <slot />
</div>

<style>
  .grid-table {
    display: grid;
    border: var(--border-radius-xs) solid var(--border-color);
    border-radius: var(--border-radius-l);
    overflow: hidden;
    grid-template-columns: var(--Grid-table__template-columns);
    grid-template-rows: var(--Grid-table__template-rows);
    background: var(--inset-background-color);
    box-shadow: var(--inset-box-shadow);
  }
</style>
