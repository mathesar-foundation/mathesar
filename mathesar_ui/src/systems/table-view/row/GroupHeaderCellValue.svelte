<script lang="ts">
  import type { ProcessedColumn } from '@mathesar/stores/table-data';
  import CellValue from '@mathesar/components/CellValue.svelte';
  import type { RecordSummariesForSheet } from '@mathesar/stores/table-data/record-summaries/recordSummaryUtils';
  import type { ResultValue } from '@mathesar/api/types/tables/records';
  import LinkedRecord from '@mathesar/components/LinkedRecord.svelte';

  export let processedColumnsMap: Map<number, ProcessedColumn>;
  export let recordSummariesForSheet: RecordSummariesForSheet;
  export let columnId: number;
  export let preprocName: string | undefined = undefined;
  export let cellValue: ResultValue | undefined = undefined;

  $: recordId = String(cellValue);
  $: recordSummary = recordSummariesForSheet
    .get(String(columnId))
    ?.get(recordId);
</script>

<span class="tag">
  <span class="name">
    {processedColumnsMap.get(columnId)?.column.name ?? ''}
    {#if preprocName}
      <span class="preproc">{preprocName}</span>
    {/if}
  </span>
  <span class="value">
    {#if recordSummary}
      <LinkedRecord {recordSummary} {recordId} />
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
      font-size: var(--text-size-small);
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
      font-size: var(--text-size-large);
    }
  }
</style>
