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

  $: ({ columnIds } = grouping);

  $: cellValue = (columnId: number) =>
    row.groupValues ? row.groupValues[columnId] : undefined;
</script>

<SheetPositionableCell
  index={1}
  columnSpan={processedColumnsMap.size}
  let:htmlAttributes
  let:style
>
  <div {...htmlAttributes} {style} class="groupheader">
    <CellBackground color="var(--cell-bg-color-header)" />
    {#each columnIds as columnId (columnId)}
      <span class="tag">
        <span class="name">
          {processedColumnsMap.get(columnId)?.column.name ?? ''}:
        </span>
        <span class="value"><CellValue value={cellValue(columnId)} /></span>
      </span>
    {/each}
    <span class="tag count">
      <span class="name">Count:</span>
      <span class="value">{group.count}</span>
    </span>
  </div>
</SheetPositionableCell>

<style lang="scss">
  [data-sheet-element='cell'].groupheader {
    padding: 0.6rem 0.4rem;
    align-items: end;
    gap: 1rem;

    .tag {
      flex-shrink: 0;

      .name {
        font-weight: 500;
      }
      .value {
        border: 1px solid var(--color-contrast-light);
        border-radius: 1.5rem;
        padding: 0.2rem 0.6rem;
      }
    }
  }
</style>
