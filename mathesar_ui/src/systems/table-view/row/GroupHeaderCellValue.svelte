<script lang="ts">
  import type { FileManifest, ResultValue } from '@mathesar/api/rpc/records';
  import { Truncate } from '@mathesar/component-library';
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

  $: processedColumn = processedColumnsMap.get(columnId);
  $: recordId = String(cellValue);
  $: recordSummary = recordSummariesForSheet
    .get(columnId)
    ?.get(recordId);
  $: linkedTableId =
    processedColumnsMap?.get(columnId)?.linkFk?.referent_table_oid;
  $: fileManifest = (() => {
    if (!processedColumn?.column.metadata?.file_backend) return undefined;
    const fileReference = parseFileReference(cellValue);
    if (!fileReference) return undefined;
    return fileManifestsForSheet.get(columnId)?.get(fileReference.mash);
  })();
</script>

<span class="tag" style="max-width: calc(100%/{totalColumns})">
  <span class="name">
    {processedColumn?.column.name ?? ''}
    {#if preprocName}
      <span class="preproc">{preprocName}</span>
    {/if}
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

<style lang="scss">
  .tag {
    overflow: hidden;
    min-width: 3em;

    .name {
      font-size: var(--sm1);
      color: var(--color-fg-base-muted);
      display: flex;
      align-items: center;
      gap: 0.14rem;
      margin-bottom: 0.2rem;

      .preproc {
        font-size: var(--sm3);
        border: 1px solid var(--color-fg-base-muted);
        padding: 0rem 0.3rem;
        border-radius: 5rem;
      }
    }
    .value {
      font-size: var(--lg1);
    }
  }
</style>
