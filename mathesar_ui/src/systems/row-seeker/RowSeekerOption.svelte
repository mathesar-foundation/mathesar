<script lang="ts">
  import type { RawColumnWithMetadata } from '@mathesar/api/rpc/columns';
  import type {
    RecordSummaryColumnData,
    RecordSummaryListResult,
  } from '@mathesar/api/rpc/records';
  import { iconExpandRight } from '@mathesar/icons';
  import { Button, Icon, MatchHighlighter } from '@mathesar-component-library';

  import type RowSeekerController from './RowSeekerController';
  import RowSeekerField from './RowSeekerField.svelte';

  export let controller: RowSeekerController;
  export let isSelected: boolean;
  export let inFocus: boolean;
  export let columns: RawColumnWithMetadata[];
  export let result: RecordSummaryListResult;
  export let linkedRecordSummaries: Record<
    string,
    RecordSummaryColumnData | undefined
  >;

  $: ({ searchValue, mode } = controller);

  let isExpanded = false;

  function getLinkedRecordSummary(column: RawColumnWithMetadata) {
    const value = result.values[column.id];
    const linkedSummary = linkedRecordSummaries[column.id];
    return linkedSummary?.[String(value)] ?? undefined;
  }

  $: columnDisplayInfo = columns.map((column) => ({
    id: column.id,
    column,
    value: result.values[column.id],
    summary: getLinkedRecordSummary(column),
  }));
  $: columnsThatMaybeUseful = (() => {
    // TODO: Come up with an algorithm to decide
    // best 3 useful columns to display
    const filtered = columnDisplayInfo
      .filter((c) => !c.column.primary_key)
      .slice(0, 3);
    if (filtered.length > 1) {
      return filtered;
    }
    return [];
  })();
  $: expandedColumnsToDisplay = columnDisplayInfo.slice(0, 10);

  async function toggleExpansion(e: Event) {
    e.stopPropagation();
    isExpanded = !isExpanded;
    await controller.focusSearch();
  }
</script>

<div
  class="record"
  class:selected={isSelected}
  class:in-focus={inFocus}
  style:min-width="{columnsThatMaybeUseful.length * 12}rem"
>
  <div class="header">
    <div class="summary">
      <MatchHighlighter text={result.summary} substring={$searchValue} />
    </div>
    {#if $mode === 'complete'}
      <div class="expand">
        <Button appearance="plain" on:click={(e) => toggleExpansion(e)}>
          <Icon {...iconExpandRight} rotate={isExpanded ? 90 : undefined} />
        </Button>
      </div>
    {/if}
  </div>
  {#if $mode === 'complete' && !isExpanded && columnsThatMaybeUseful.length}
    <div class="column-content column-tags">
      {#each columnsThatMaybeUseful as cdi (cdi.id)}
        <RowSeekerField {controller} columnDisplayInfo={cdi} />
      {/each}
    </div>
  {/if}

  {#if isExpanded}
    <div class="column-content all-columns">
      <div class="column-tags">
        {#each expandedColumnsToDisplay as cdi (cdi.id)}
          <RowSeekerField {controller} columnDisplayInfo={cdi} />
        {/each}
      </div>
    </div>
  {/if}
</div>

<style lang="scss">
  .record {
    white-space: normal;
    border-bottom: 1px solid var(--border-color);

    &.selected {
      background-color: var(--active-background);
    }
  }

  .header {
    display: flex;
  }

  .summary {
    font-weight: var(--font-weight-medium);
    padding: var(--sm4) var(--sm1);
  }

  .expand {
    color: var(--gray-300);
    margin-left: auto;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 var(--sm1);
    --button-padding: var(--sm5);
  }

  .record:hover,
  .record.in-focus {
    .expand {
      color: var(--gray-500);
    }
  }

  .column-content {
    padding-bottom: var(--sm3);
    padding-left: var(--sm1);
    padding-right: var(--sm1);
  }

  .column-tags {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--sm4);
  }
</style>
