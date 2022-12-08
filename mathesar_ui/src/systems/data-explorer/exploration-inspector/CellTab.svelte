<script lang="ts">
  import CellFabric from '@mathesar/components/cell-fabric/CellFabric.svelte';
  import type QueryRunner from '../QueryRunner';

  export let queryHandler: QueryRunner;
  $: ({ selection, processedColumns } = queryHandler);
  $: ({ activeCell } = selection);

  $: selectedCellValue = (() => {
    const cell = $activeCell;
    if (cell) {
      const rows = queryHandler.getRows();
      if (rows[cell.rowIndex]) {
        return rows[cell.rowIndex].record[cell.columnId];
      }
    }
    return undefined;
  })();
  $: processedQueryColumn = (() => {
    const cell = $activeCell;
    if (cell) {
      const processedColumn = $processedColumns.get(String(cell.columnId));
      if (processedColumn) {
        return processedColumn;
      }
    }
    return undefined;
  })();
</script>

<div
  class="section-content"
  class:has-content={selectedCellValue !== undefined}
>
  {#if selectedCellValue !== undefined}
    <section class="cell-content">
      <header>Content</header>
      <div class="content">
        {#if processedQueryColumn}
          <CellFabric
            isIndependentOfSheet={true}
            disabled={true}
            columnFabric={processedQueryColumn}
            value={selectedCellValue}
          />
        {/if}
      </div>
    </section>
  {:else}
    Select a cell to view it's properties.
  {/if}
</div>

<style lang="scss">
  .section-content {
    &.has-content {
      padding: var(--size-x-small);
    }
    .cell-content {
      header {
        font-weight: 500;
      }
      .content {
        word-wrap: anywhere;
        border: 1px solid var(--slate-300);
        padding: var(--size-xx-small);
        border-radius: var(--border-radius-m);
        margin-top: var(--size-x-small);
      }
    }
  }
</style>
