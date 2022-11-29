<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { InputGroupText, Select } from '@mathesar-component-library';
  import {
    filterCombinations,
    defaultFilterCombination,
    getTabularDataStoreFromContext,
    type FilterEntry,
  } from '@mathesar/stores/table-data';
  import type { FilterCombination } from '@mathesar/api/types/tables/records';
  import { FilterEntry as FilterEntryComponent } from '@mathesar/components/filter-entry';

  const dispatch = createEventDispatcher<{
    remove: number;
    update: number;
    updateCombination: FilterCombination;
  }>();

  const tabularData = getTabularDataStoreFromContext();
  $: ({ processedColumns, recordsData } = $tabularData);

  export let entries: FilterEntry[];
  export let filterCombination: FilterCombination = defaultFilterCombination;
</script>

{#each entries as entry, index (entry)}
  <FilterEntryComponent
    columns={[...$processedColumns.values()]}
    getColumnLabel={(column) =>
      $processedColumns.get(column.id)?.column.name ?? ''}
    bind:columnIdentifier={entry.columnId}
    bind:conditionIdentifier={entry.conditionId}
    bind:value={entry.value}
    numberOfFilters={entries.length}
    on:removeFilter={() => dispatch('remove', index)}
    on:update
    recordSummaryStore={recordsData.recordSummaries}
  >
    {#if index === 0}
      <InputGroupText>where</InputGroupText>
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
