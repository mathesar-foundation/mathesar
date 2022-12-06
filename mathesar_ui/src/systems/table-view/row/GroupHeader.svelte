<script lang="ts">
  import { SheetPositionableCell } from '@mathesar/components/sheet';
  import type {
    RecordGrouping,
    RecordGroup,
    GroupHeaderRow,
    ProcessedColumn,
  } from '@mathesar/stores/table-data';
  import type { RecordSummariesForSheet } from '@mathesar/stores/table-data/record-summaries/recordSummaryUtils';
  import CellBackground from '@mathesar/components/CellBackground.svelte';
  import { Badge } from '@mathesar-component-library';
  import GroupHeaderCellValue from './GroupHeaderCellValue.svelte';

  export let processedColumnsMap: Map<number, ProcessedColumn>;
  export let row: GroupHeaderRow;
  export let grouping: RecordGrouping;
  export let group: RecordGroup;
  export let recordSummariesForSheet: RecordSummariesForSheet;

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

<SheetPositionableCell
  index={1}
  columnSpan={processedColumnsMap.size}
  let:htmlAttributes
  let:style
>
  <div {...htmlAttributes} {style} class="group-header">
    <CellBackground color="var(--sand-200)" />
    <div class="groups-data">
      {#each columnIds as columnId, index (columnId)}
        <GroupHeaderCellValue
          {processedColumnsMap}
          cellValue={row.groupValues ? row.groupValues[columnId] : undefined}
          {recordSummariesForSheet}
          {columnId}
          preprocName={preprocNames[index]}
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
    padding: 0.5rem 0.4rem;

    .groups-data {
      align-items: start;
      display: flex;
      gap: 1rem;
    }

    .count-container {
      --badge-font-size: var(--text-size-small);
      --badge-text-color: var(--slate-800);
      --badge-background-color: var(--slate-100);
      height: 100%;
    }
  }
</style>
