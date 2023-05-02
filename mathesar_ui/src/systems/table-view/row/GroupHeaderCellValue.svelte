<script lang="ts">
  import type { ProcessedColumn } from '@mathesar/stores/table-data';
  import CellValue from '@mathesar/components/CellValue.svelte';
  import type { RecordSummariesForSheet } from '@mathesar/stores/table-data/record-summaries/recordSummaryUtils';
  import type { ResultValue } from '@mathesar/api/types/tables/records';
  import LinkedRecord from '@mathesar/components/LinkedRecord.svelte';
  import { storeToGetRecordPageUrl } from '@mathesar/stores/storeBasedUrls';
  import Truncate from '@mathesar/component-library/truncate/Truncate.svelte';

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
    tableId: processedColumnsMap?.get(columnId)?.linkFk?.referent_table,
    recordId,
  });
</script>

<div class="group-item truncate">
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
        <Truncate>
          <CellValue value={cellValue} />
        </Truncate>
      {/if}
    </span>
  </span>
</div>

<style lang="scss">
  .group-item {
    flex-shrink: 0;
    align-items: center;
    overflow: hidden;

    &.truncate {
      // Apply the same truncating logic with BreadcrumbItem.
      flex: 1 0 0;
      max-width: max-content;
    }
  }
  .tag {
    display: block;
    overflow: hidden;
    .name {
      font-size: var(--text-size-small);
      color: var(--color-text-muted);
      display: flex;
      align-items: center;
      gap: 0.14rem;
      margin-bottom: 0.2rem;

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
