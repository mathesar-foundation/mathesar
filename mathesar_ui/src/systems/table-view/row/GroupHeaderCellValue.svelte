<script lang="ts">
  import type { ResultValue } from '@mathesar/api/rpc/records';
  import CellValue from '@mathesar/components/CellValue.svelte';
  import LinkedRecord from '@mathesar/components/LinkedRecord.svelte';
  import { storeToGetRecordPageUrl } from '@mathesar/stores/storeBasedUrls';
  import type { ProcessedColumn } from '@mathesar/stores/table-data';
  import type { RecordSummariesForSheet } from '@mathesar/stores/table-data/record-summaries/recordSummaryUtils';

  export let processedColumnsMap: Map<number, ProcessedColumn>;
  export let recordSummariesForSheet: RecordSummariesForSheet;
  export let columnId: number;
  export let preprocName: string | undefined = undefined;
  export let cellValue: ResultValue | undefined = undefined;

  $: recordId = String(cellValue);
  $: recordSummary = recordSummariesForSheet
    .get(String(columnId))
    ?.get(recordId);
  $: recordPageHref = $storeToGetRecordPageUrl({
    tableId: processedColumnsMap?.get(columnId)?.linkFk?.referent_table_oid,
    recordId,
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
    {#if recordSummary}
      <LinkedRecord {recordSummary} {recordId} {recordPageHref} />
    {:else}
      <CellValue value={cellValue} />
    {/if}
  </span>
</span>

<style lang="scss">
  .tag {
    .name {
      font-size: var(--sm1);
      color: var(--text-muted);
      display: flex;
      align-items: center;
      gap: 0.14rem;
      margin-bottom: 0.2rem;

      .preproc {
        font-size: var(--sm3);
        border: 1px solid var(--text-muted);
        padding: 0rem 0.3rem;
        border-radius: 5rem;
      }
    }
    .value {
      font-size: var(--lg1);
    }
  }
</style>
