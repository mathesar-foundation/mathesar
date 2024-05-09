<script lang="ts">
  /**
   * @file
   *
   * NOTICE: There is some code duplication between this file and
   * `CellMode.svelte` used for the table view. It might be good to resolve this
   * duplication at some point. In the meantime, be mindful of propagating
   * changes to both files as necessary.
   */
  import { _ } from 'svelte-i18n';

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
      <header>{$_('content')}</header>
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
    {$_('select_cell_view_properties')}
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
        white-space: pre-wrap;
        border: 1px solid var(--slate-300);
        padding: var(--size-xx-small);
        border-radius: var(--border-radius-m);
        margin-top: var(--size-x-small);
      }
    }
  }
</style>
