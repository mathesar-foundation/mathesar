<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { _ } from 'svelte-i18n';

  import type { FilterCombination } from '@mathesar/api/rpc/records';
  import { FilterEntry as FilterEntryComponent } from '@mathesar/components/filter-entry';
  import {
    type FilterEntry,
    type ProcessedColumns,
    defaultFilterCombination,
    filterCombinations,
  } from '@mathesar/stores/table-data';
  import type RecordSummaryStore from '@mathesar/stores/table-data/record-summaries/RecordSummaryStore';
  import { getColumnConstraintTypeByColumnId } from '@mathesar/utils/columnUtils';
  import { InputGroupText, Select } from '@mathesar-component-library';

  const dispatch = createEventDispatcher<{
    remove: number;
    update: number;
    updateCombination: FilterCombination;
  }>();

  export let processedColumns: ProcessedColumns;
  export let recordSummaries: RecordSummaryStore;
  export let entries: FilterEntry[];
  export let filterCombination: FilterCombination = defaultFilterCombination;
</script>

{#each entries as entry, index (entry)}
  <FilterEntryComponent
    columns={processedColumns}
    getColumnLabel={(column) =>
      processedColumns.get(column.id)?.column.name ?? ''}
    getColumnConstraintType={(column) =>
      getColumnConstraintTypeByColumnId(column.id, processedColumns)}
    bind:columnIdentifier={entry.columnId}
    bind:conditionIdentifier={entry.conditionId}
    bind:value={entry.value}
    numberOfFilters={entries.length}
    on:removeFilter={() => dispatch('remove', index)}
    on:update
    recordSummaryStore={recordSummaries}
  >
    {#if index === 0}
      <InputGroupText>{$_('where')}</InputGroupText>
    {:else if index === 1}
      <Select
        options={filterCombinations}
        bind:value={filterCombination}
        on:change={() => dispatch('updateCombination', filterCombination)}
      />
    {:else}
      <InputGroupText>{filterCombination}</InputGroupText>
    {/if}
  </FilterEntryComponent>
{/each}
