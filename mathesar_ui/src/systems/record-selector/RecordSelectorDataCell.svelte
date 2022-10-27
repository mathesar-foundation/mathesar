<script lang="ts">
  import type { Writable } from 'svelte/store';

  import CellFabric from '@mathesar/components/cell-fabric/CellFabric.svelte';
  import {
    rowHasSavedRecord,
    SearchFuzzy,
    type ProcessedColumn,
    type RecordRow,
  } from '@mathesar/stores/table-data';
  import type RecordSummaryStore from '@mathesar/stores/table-data/record-summaries/RecordSummaryStore';
  import Cell from './RecordSelectorCellWrapper.svelte';

  /**
   * If `value` is longer than the number of characters specified here, then
   * we'll add a `title` attribute to the cell so that users can hover over
   * truncated cell values to see the full text.
   *
   * The value for the threshold is a little bit arbitrary.
   *
   * - Setting it to `0` might provide a poor UX by putting tooltips in too many
   *   places unnecessarily.
   *
   * - Setting it too high would mean that some truncated text would be
   *   unavailable to user through hovering.
   *
   * The "perfect" value here is quite difficult to compute because it depends
   * on the max-width set for the cell (defined in CSS) and the actual text
   * content (because some characters are wider than others). So this is a "best
   * guess" that errs on the side of displaying too many tool tips as opposed to
   * too few.
   *
   * An alternate approach would be to display the tooltip only when the cell
   * has overflow. That's a bit tricky to do reactively. If the simplistic
   * approach here proves to be insufficient, then we can explore more
   * sophisticated approaches, potentially using the `overflowObserver` action.
   */
  const titlingThreshold = 25;

  export let row: RecordRow;
  export let processedColumn: ProcessedColumn;
  export let recordSummaries: RecordSummaryStore;
  export let searchFuzzy: Writable<SearchFuzzy>;

  $: ({ column } = processedColumn);
  $: searchValue = $searchFuzzy.get(column.id);
  $: value = row?.record?.[column.id];
  $: recordSummary = $recordSummaries
    .get(String(column.id))
    ?.get(String(value));
  $: displayedValue = recordSummary ?? String(value) ?? '';
  $: title =
    displayedValue.length > titlingThreshold ? displayedValue : undefined;
</script>

<Cell rowType="dataRow" columnType="dataColumn" {title}>
  <CellFabric
    columnFabric={processedColumn}
    {value}
    {recordSummary}
    disabled
    showAsSkeleton={!rowHasSavedRecord(row)}
    {searchValue}
  />
</Cell>
