<script lang="ts">
  /**
   * @file
   *
   * NOTICE: There is some code duplication between this file and
   * `CellTab.svelte` used for the data explorer. It might be good to resolve
   * this duplication at some point. In the meantime, be mindful of propagating
   * changes to both files as necessary.
   */
  import { _ } from 'svelte-i18n';
  import { getTabularDataStoreFromContext } from '@mathesar/stores/table-data';
  import CellFabric from '@mathesar/components/cell-fabric/CellFabric.svelte';

  const tabularData = getTabularDataStoreFromContext();

  $: ({ selection, recordsData, processedColumns } = $tabularData);
  $: ({ activeCell } = selection);
  $: ({ recordSummaries } = recordsData);
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
  $: recordSummary =
    column &&
    $recordSummaries.get(String(column.id))?.get(String(selectedCellValue));
</script>

<div class="section-content">
  {#if selectedCellValue !== undefined}
    <section class="cell-content">
      <header>{$_('content')}</header>
      <div class="content">
        {#if column}
          <CellFabric
            isIndependentOfSheet={true}
            disabled={true}
            columnFabric={column}
            value={selectedCellValue}
            {recordSummary}
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
    padding: var(--size-x-small);
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
