<script lang="ts">
  import { _ } from 'svelte-i18n';

  import { getTabularDataStoreFromContext } from '@mathesar/stores/table-data';
  import CellFabric from '@mathesar/components/cell-fabric/CellFabric.svelte';
  import { parseCellId } from '@mathesar/components/sheet/cellIds';

  const tabularData = getTabularDataStoreFromContext();

  export let activeCellId: string;

  $: ({ recordsData, processedColumns } = $tabularData);
  $: ({ recordSummaries, selectableRowsMap } = recordsData);
  $: rows = $selectableRowsMap;
  $: ({ rowId, columnId } = parseCellId(activeCellId));
  $: record = rows.get(rowId) ?? {};
  $: selectedCellValue = record[columnId];
  $: column = $processedColumns.get(Number(columnId));
  $: recordSummary =
    column &&
    $recordSummaries.get(String(column.id))?.get(String(selectedCellValue));
</script>

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

<style lang="scss">
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
</style>
