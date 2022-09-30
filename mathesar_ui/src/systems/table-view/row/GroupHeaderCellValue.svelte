<script lang="ts">
  import type { ProcessedColumn } from '@mathesar/stores/table-data/types';
  import CellValue from '@mathesar/components/CellValue.svelte';
  import {
    buildDataForRecordSummaryInFkCell,
    type DataForRecordSummariesInFkColumns,
  } from '@mathesar/stores/table-data/record-summaries/recordSummaryUtils';
  import type { ResultValue } from '@mathesar/api/tables/records';
  import LinkedRecord from '@mathesar/components/LinkedRecord.svelte';

  export let processedColumnsMap: Map<number, ProcessedColumn>;
  export let dataForRecordSummariesInFkColumns: DataForRecordSummariesInFkColumns;
  export let columnId: number;
  export let preprocName: string | undefined = undefined;
  export let cellValue: ResultValue | undefined = undefined;

  $: recordId = String(cellValue);
  $: dataForRecordSummaryInFkCell = buildDataForRecordSummaryInFkCell({
    recordId,
    stringifiedColumnId: String(columnId),
    dataForRecordSummariesInFkColumns,
  });
</script>

<span class="tag">
  <span class="name">
    {processedColumnsMap.get(columnId)?.column.name ?? ''}
    {#if preprocName}
      <span class="preproc">{preprocName}</span>
    {/if}
  </span>
  <span class="value">
    {#if dataForRecordSummaryInFkCell}
      <LinkedRecord {dataForRecordSummaryInFkCell} {recordId} />
    {:else}
      <CellValue value={cellValue} />
    {/if}
  </span>
</span>

<style lang="scss">
  .tag {
    overflow: hidden;
    display: flex;
    align-items: start;
    flex-direction: column;
    gap: 0.2rem;

    .name {
      font-size: var(--text-size-x-small);
      color: var(--color-text-muted);
      display: flex;
      align-items: center;
      gap: 0.14rem;

      .preproc {
        font-size: var(--text-size-xx-small);
        border: 1px solid var(--color-text-muted);
        padding: 0rem 0.3rem;
        border-radius: 5rem;
      }
    }
    .value {
      font-weight: 500;
    }
  }
</style>
