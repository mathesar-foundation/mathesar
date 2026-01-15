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

  export let processedColumnsMap: Map<string, ProcessedColumn>;
  export let row: GroupHeaderRow;
  export let grouping: RecordGrouping;
  export let group: RecordGroup;
  export let recordSummariesForSheet: RecordSummariesForSheet;
  export let fileManifestsForSheet: AssociatedCellValuesForSheet<FileManifest>;

  let containerElement: HTMLElement;
  let containerWidth = 0;

  $: ({ columnIds, preprocIds } = grouping);
  $: preProcFunctionsForColumn = columnIds.map(
    (columnId) =>
      processedColumnsMap.get(String(columnId))?.preprocFunctions ?? [],
  );
  $: preprocNames = preprocIds.map((preprocId, index) =>
    preprocId
      ? preProcFunctionsForColumn[index].find(
          (preprocFn) => preprocFn.id === preprocId,
        )?.name
      : undefined,
  );

  function handleWheel(event: WheelEvent) {
    // Pass horizontal scroll to the parent sheet
    if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) {
      const sheetBody = containerElement?.closest(
        '[data-sheet-element="body"]',
      );
      if (sheetBody) {
        sheetBody.scrollLeft += event.deltaX;
      }
    }
  }
</script>

<SheetPositionableCell index={0} columnSpan={processedColumnsMap.size + 1}>
  <div
    class="group-header"
    bind:this={containerElement}
    bind:clientWidth={containerWidth}
    on:wheel={handleWheel}
  >
    <div class="groups-data">
      {#each columnIds as columnId, index (columnId)}
        {@const stringColumnId = String(columnId)}
        <GroupHeaderCellValue
          {processedColumnsMap}
          cellValue={row.groupValues
            ? row.groupValues[stringColumnId]
            : undefined}
          {recordSummariesForSheet}
          columnId={stringColumnId}
          preprocName={preprocNames[index]}
          {fileManifestsForSheet}
          totalColumns={columnIds.length}
          {containerWidth}
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
    position: sticky;
    left: 0;
    z-index: var(--z-index__sheet__row-header-cell);
    padding: var(--sm4) var(--lg1);
    background-color: var(--color-bg-header);
    height: 100%;
    border-bottom: 1px solid var(--color-border-grid);
    border-right: 1px solid var(--color-border-grid);
    overflow: hidden;
    cursor: default;

    .groups-data {
      align-items: start;
      display: flex;
      gap: 1rem;
      overflow: hidden;
      width: 100%;
    }

    .count-container {
      --badge-font-size: var(--sm1);
      --badge-text-color: var(--color-fg-subtle-1);
      --badge-background-color: var(--color-bg-sunken-1-hover);
      height: 100%;
      flex-shrink: 0;
    }
  }
</style>
