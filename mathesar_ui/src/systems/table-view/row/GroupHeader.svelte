<script lang="ts">
  import { SheetPositionableCell } from '@mathesar/components/sheet';
  import type { Grouping, Group } from '@mathesar/stores/table-data/records';
  import type { Row, ProcessedColumn } from '@mathesar/stores/table-data/types';
  import CellValue from '@mathesar/components/CellValue.svelte';
  import CellBackground from './CellBackground.svelte';

  export let processedColumnsMap: Map<number, ProcessedColumn>;
  export let row: Row;
  export let grouping: Grouping;
  export let group: Group;

  $: ({ columnIds, preprocIds } = grouping);

  $: cellValue = (columnId: number) =>
    row.groupValues ? row.groupValues[columnId] : undefined;

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
  <div {...htmlAttributes} {style} class="groupheader">
    <CellBackground color="var(--cell-bg-color-header)" />
    {#each columnIds as columnId, index (columnId)}
      <span class="tag">
        <span class="name">
          {processedColumnsMap.get(columnId)?.column.name ?? ''}
          {#if preprocNames[index]}
            <span class="preproc">
              {preprocNames[index]}
            </span>
          {/if}
        </span>
        <span class="value"><CellValue value={cellValue(columnId)} /></span>
      </span>
    {/each}
    <span class="tag count">
      <span class="name">Count</span>
      <span class="value">{group.count}</span>
    </span>
  </div>
</SheetPositionableCell>

<style lang="scss">
  [data-sheet-element='cell'].groupheader {
    padding: 0.5rem 0.4rem;
    align-items: end;
    gap: 1rem;

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
  }
</style>
