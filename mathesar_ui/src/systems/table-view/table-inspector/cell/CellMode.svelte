<script lang="ts">
  import { getTabularDataStoreFromContext } from '@mathesar/stores/table-data';

  import CellFabric from '@mathesar/components/cell-fabric/CellFabric.svelte';

  const tabularData = getTabularDataStoreFromContext();
  $: ({ selection, recordsData, processedColumns } = $tabularData);
  $: ({ activeCell } = selection);

  $: cell = $activeCell;
  $: selectedCellValue = (() => {
    if (cell) {
      const rows = recordsData.getRecordRows();
      if (rows[cell.rowIndex]) {
        return rows[cell.rowIndex].record[cell.columnId];
      }
    }
    return undefined;
  })();
  $: column = (() => {
    if (cell) {
      const processedColumn = $processedColumns.get(Number(cell.columnId));
      if (processedColumn) {
        return processedColumn;
      }
    }
    return undefined;
  })();
</script>

<div class="section-content">
  {#if selectedCellValue !== undefined}
    <section class="cell-content">
      <header>Content</header>
      <div class="content">
        {#if column}
          <CellFabric
            isIndependentOfSheet={false}
            disabled={true}
            columnFabric={column}
            value={selectedCellValue}
            wrapConditionally={true}
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
    padding: var(--size-x-small);

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
