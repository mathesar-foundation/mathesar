<script lang="ts">
  import type { FileManifest } from '@mathesar/api/rpc/records';
  import { SheetPositionableCell } from '@mathesar/components/sheet';
  import type { AssociatedCellValuesForSheet } from '@mathesar/stores/AssociatedCellData';
  import type {
    GroupHeaderRow,
    ProcessedColumn,
    RecordGroup,
    RecordGrouping,
  } from '@mathesar/stores/table-data';
  import type { RecordSummariesForSheet } from '@mathesar/stores/table-data/record-summaries/recordSummaryUtils';
  import { Badge } from '@mathesar-component-library';

  import GroupHeaderCellValue from './GroupHeaderCellValue.svelte';

  export let processedColumnsMap: Map<number, ProcessedColumn>;
  export let row: GroupHeaderRow;
  export let grouping: RecordGrouping;
  export let group: RecordGroup;
  export let recordSummariesForSheet: RecordSummariesForSheet;
  export let fileManifestsForSheet: AssociatedCellValuesForSheet<FileManifest>;

  $: ({ columnIds, preprocIds } = grouping);
  $: preProcFunctionsForColumn = columnIds.map(
    (columnId) => processedColumnsMap.get(columnId)?.preprocFunctions ?? [],
  );
  $: preprocNames = preprocIds.map((preprocId, index) =>
    preprocId
      ? preProcFunctionsForColumn[index].find(
          (preprocFn) => preprocFn.id === preprocId,
        )?.name
      : undefined,
  );
</script>

<SheetPositionableCell index={0} columnSpan={processedColumnsMap.size + 1}>
  <div class="group-header">
    <div class="groups-data">
      {#each columnIds as columnId, index (columnId)}
        <GroupHeaderCellValue
          {processedColumnsMap}
          cellValue={row.groupValues ? row.groupValues[columnId] : undefined}
          {recordSummariesForSheet}
          {columnId}
          preprocName={preprocNames[index]}
          {fileManifestsForSheet}
          totalColumns={columnIds.length}
        />
      {/each}
      <div class="count-container">
        <Badge>
          {group.count}
        </Badge>
      </div>
    </div>
  </div>
</SheetPositionableCell>

<style lang="scss">
  .group-header {
    padding: var(--sm4) var(--lg1);
    background-color: var(--color-bg-header);
    height: 100%;
    border-bottom: 1px solid var(--color-border-grid);
    border-right: 1px solid var(--color-border-grid);
    overflow: hidden;

    .groups-data {
      align-items: start;
      display: flex;
      gap: 1rem;
      overflow: hidden;
    }

    .count-container {
      --badge-font-size: var(--sm1);
      --badge-text-color: var(--color-fg-subtle-1);
      --badge-background-color: var(--color-bg-sunken-1-hover);
      height: 100%;
    }
  }
</style>
