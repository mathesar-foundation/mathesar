<script lang="ts">
  import type { FileManifest, ResultValue } from '@mathesar/api/rpc/records';
  import { Tooltip, Truncate } from '@mathesar/component-library';
  import CellValue from '@mathesar/components/CellValue.svelte';
  import { parseFileReference } from '@mathesar/components/file-attachments/fileUtils';
  import LinkedRecord from '@mathesar/components/LinkedRecord.svelte';
  import type { AssociatedCellValuesForSheet } from '@mathesar/stores/AssociatedCellData';
  import type { ProcessedColumn } from '@mathesar/stores/table-data';
  import type { RecordSummariesForSheet } from '@mathesar/stores/table-data/record-summaries/recordSummaryUtils';

  export let processedColumnsMap: Map<string, ProcessedColumn>;
  export let recordSummariesForSheet: RecordSummariesForSheet;
  export let columnId: string;
  export let preprocName: string | undefined = undefined;
  export let cellValue: ResultValue | undefined = undefined;
  export let fileManifestsForSheet: AssociatedCellValuesForSheet<FileManifest>;
  export let totalColumns: number;
  export let containerWidth = 0;

  $: processedColumn = processedColumnsMap.get(columnId);
  $: recordId = String(cellValue);
  $: recordSummary = recordSummariesForSheet.get(columnId)?.get(recordId);
  $: linkedTableId =
    processedColumnsMap?.get(columnId)?.linkFk?.referent_table_oid;
  $: fileManifest = (() => {
    if (!processedColumn?.column.metadata?.file_backend) return undefined;
    const fileReference = parseFileReference(cellValue);
    if (!fileReference) return undefined;
    return fileManifestsForSheet.get(columnId)?.get(fileReference.mash);
  })();

  // Calculate equal width for all items considering padding and gaps
  // Reserve space for count badge (~80px) and gaps (1rem each)
  const BADGE_WIDTH = 80;
  const DEFAULT_GAP_WIDTH = 16;
  const GAP_WIDTH =
    typeof window !== 'undefined'
      ? (() => {
          const root = document.documentElement;
          const fontSize = getComputedStyle(root).fontSize;
          const parsed = parseFloat(fontSize);
          return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_GAP_WIDTH;
        })()
      : DEFAULT_GAP_WIDTH;

  type WidthMetrics = {
    availableWidth: number;
    maxItemWidth: number;
  };

  const widthMetricsCache = new Map<string, WidthMetrics>();

  function getWidthMetrics(
    containerWidth: number,
    totalColumns: number,
  ): WidthMetrics {
    const key = `${containerWidth}-${totalColumns}`;
    const cached = widthMetricsCache.get(key);
    if (cached) {
      return cached;
    }

    const availableWidth =
      containerWidth > 0
        ? Math.max(
            0,
            containerWidth - BADGE_WIDTH - totalColumns * GAP_WIDTH - 32,
          ) // 32 for padding
        : 0;

    const maxItemWidth =
      availableWidth > 0 && totalColumns > 0
        ? Math.floor(availableWidth / totalColumns)
        : 0;

    const metrics: WidthMetrics = { availableWidth, maxItemWidth };
    widthMetricsCache.set(key, metrics);
    return metrics;
  }

  $: ({ availableWidth, maxItemWidth } = getWidthMetrics(
    containerWidth,
    totalColumns,
  ));
  $: displayValue = (() => {
    if (recordSummary) return recordSummary;
    if (fileManifest) return fileManifest.uri;
    return cellValue;
  })();

  $: tooltipText = (() => {
    const columnName = processedColumn?.column.name ?? '';
    const preprocText = preprocName ? ` (${preprocName})` : '';
    let valueText = '';
    if (
      typeof displayValue === 'object' &&
      displayValue !== null &&
      'summaryLabel' in displayValue
    ) {
      valueText = String(
        (displayValue as { summaryLabel: unknown }).summaryLabel,
      );
    } else {
      valueText = String(displayValue ?? '');
    }
    return `${columnName}${preprocText}: ${valueText}`;
  })();
</script>

<Tooltip placement="top">
  <span
    slot="trigger"
    class="tag"
    style:max-width={maxItemWidth > 0 ? `${maxItemWidth}px` : 'none'}
    style:flex-basis={maxItemWidth > 0 ? `${maxItemWidth}px` : 'auto'}
  >
    <span class="name">
      <Truncate>
        {processedColumn?.column.name ?? ''}
        {#if preprocName}
          <span class="preproc">{preprocName}</span>
        {/if}
      </Truncate>
    </span>
    <span class="value">
      {#if recordSummary}
        <LinkedRecord
          {recordSummary}
          {recordId}
          tableId={linkedTableId}
          allowsHyperlinks
        />
      {:else if processedColumn?.abstractType.identifier === 'file' && fileManifest}
        <Truncate>
          {fileManifest.uri}
        </Truncate>
      {:else}
        <Truncate>
          <CellValue value={cellValue} />
        </Truncate>
      {/if}
    </span>
  </span>
  <div slot="content">{tooltipText}</div>
</Tooltip>

<style lang="scss">
  .tag {
    overflow: hidden;
    min-width: 3em;
    flex-shrink: 1;
    flex-grow: 0;
    display: flex;
    flex-direction: column;

    .name {
      font-size: var(--sm1);
      color: var(--color-fg-base-muted);
      display: flex;
      align-items: center;
      gap: 0.14rem;
      margin-bottom: 0.2rem;
      overflow: hidden;

      .preproc {
        font-size: var(--sm3);
        border: 1px solid var(--color-fg-base-muted);
        padding: 0rem 0.3rem;
        border-radius: 5rem;
        flex-shrink: 0;
      }
    }
    .value {
      font-size: var(--lg1);
      overflow: hidden;
    }
  }
</style>
