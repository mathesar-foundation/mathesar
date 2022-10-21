<script lang="ts">
  import { SheetPositionableCell } from '@mathesar/components/sheet';
  import type {
    RecordGrouping,
    RecordGroup,
    GroupHeaderRow,
    ProcessedColumn,
  } from '@mathesar/stores/table-data';
  import type { RecordSummariesForSheet } from '@mathesar/stores/table-data/record-summaries/recordSummaryUtils';
  import CellBackground from './CellBackground.svelte';
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
    <CellBackground color="var(--cell-bg-color-header)" />
    {#each columnIds as columnId, index (columnId)}
      <GroupHeaderCellValue
        {processedColumnsMap}
        cellValue={row.groupValues ? row.groupValues[columnId] : undefined}
        {recordSummariesForSheet}
        {columnId}
        preprocName={preprocNames[index]}
      />
    {/each}
    <span class="tag count">
      <span class="name">Count</span>
      <span class="value">{group.count}</span>
    </span>
  </div>
</SheetPositionableCell>

<style>
  .group-header {
    padding: 0.5rem 0.4rem;
    align-items: end;
    gap: 1rem;
  }
</style>
