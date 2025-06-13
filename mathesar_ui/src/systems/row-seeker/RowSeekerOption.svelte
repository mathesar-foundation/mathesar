<script lang="ts">
  import type { Column } from '@mathesar/api/rpc/columns';
  import type {
    RecordSummaryColumnData,
    Result,
  } from '@mathesar/api/rpc/records';
  import { iconExpandRight } from '@mathesar/icons';
  import { Button, Icon } from '@mathesar-component-library';

  import RowSeekerField from './RowSeekerField.svelte';

  export let isSelected: boolean;
  export let inFocus: boolean;
  export let columns: Column[];
  export let record: Result;
  export let summary: string;
  export let linkedRecordSummaries: Record<
    string,
    RecordSummaryColumnData | undefined
  >;

  let isExpanded = false;

  function getColumnDisplayValue(column: Column) {
    const value = record[column.id];
    const linkedSummary = linkedRecordSummaries[column.id];
    if (linkedSummary?.[String(value)]) {
      return {
        summary: linkedSummary?.[String(value)],
        value,
      };
    }
    return {
      value,
    };
  }

  $: columnDisplayInfo = columns.map((column) => ({
    id: column.id,
    column,
    display: getColumnDisplayValue(column),
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

  function toggleExpansion(e: Event) {
    e.stopPropagation();
    isExpanded = !isExpanded;
  }
</script>

<div class="record" class:selected={isSelected} class:in-focus={inFocus}>
  <div class="header">
    <div class="summary">
      {summary}
    </div>
    <div class="expand">
      <Button appearance="plain" on:click={(e) => toggleExpansion(e)}>
        <Icon {...iconExpandRight} rotate={isExpanded ? 90 : undefined} />
      </Button>
    </div>
  </div>
  {#if !isExpanded && columnsThatMaybeUseful.length}
    <div class="column-tags">
      {#each columnsThatMaybeUseful as cdi (cdi.id)}
        <RowSeekerField columnDisplayInfo={cdi} />
      {/each}
    </div>
  {:else if isExpanded}
    <div class="column-tags">
      {#each expandedColumnsToDisplay as cdi (cdi.id)}
        <RowSeekerField columnDisplayInfo={cdi} />
      {/each}
    </div>
  {/if}
</div>

<style lang="scss">
  .record {
    white-space: normal;
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

  .column-tags {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--sm4);
    padding-bottom: var(--sm3);
    padding-left: var(--sm1);
    padding-right: var(--sm1);
  }
</style>
