<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { _ } from 'svelte-i18n';

  import { FilterEntry as FilterEntryComponent } from '@mathesar/components/filter-entry';
  import type AssociatedCellData from '@mathesar/stores/AssociatedCellData';
  import {
    type FilterEntry,
    type ProcessedColumns,
    filterCombinations,
  } from '@mathesar/stores/table-data';
  import type {
    FilterCombination,
    Filtering,
  } from '@mathesar/stores/table-data/filtering';
  import { getColumnConstraintTypeByColumnId } from '@mathesar/utils/columnUtils';
  import { InputGroupText, Select } from '@mathesar-component-library';

  const dispatch = createEventDispatcher<{
    remove: number;
    update: number;
    updateCombination: FilterCombination;
  }>();

  export let processedColumns: ProcessedColumns;
  export let recordSummaries: AssociatedCellData<string>;
  export let filter: FilterEntry | Filtering;
  export let numberOfFilters = 1;

  function remove(index: number) {
    if ('withoutEntry' in filter) {
      filter = filter.withoutEntry(index);
      dispatch('update');
    }
  }
</script>

{#if 'entries' in filter}
  <div class="filter-group">
    <div class="prefix">
      <slot />
    </div>
    {#each filter.entries as innerFilter, index (innerFilter)}
      <svelte:self
        {processedColumns}
        {recordSummaries}
        bind:filter={innerFilter}
        numberOfFilters={filter.entries.length}
        on:update
        on:remove={() => remove(index)}
      >
        {#if index === 0}
          <InputGroupText>{$_('where')}</InputGroupText>
        {:else if index === 1 && filter.entries.length > 1}
          <Select
            options={filterCombinations}
            bind:value={filter.combination}
            on:change={() => dispatch('update')}
          />
        {:else if filter.entries.length > 1}
          <InputGroupText>{filter.combination}</InputGroupText>
        {/if}
      </svelte:self>
    {/each}
  </div>
{:else}
  <FilterEntryComponent
    columns={processedColumns}
    getColumnLabel={(column) =>
      processedColumns.get(column.id)?.column.name ?? ''}
    getColumnConstraintType={(column) =>
      getColumnConstraintTypeByColumnId(column.id, processedColumns)}
    bind:columnIdentifier={filter.columnId}
    bind:conditionIdentifier={filter.conditionId}
    bind:value={filter.value}
    {numberOfFilters}
    on:removeFilter={() => dispatch('remove')}
    on:update
    recordSummaryStore={recordSummaries}
  >
    <slot />
  </FilterEntryComponent>
{/if}

<style lang="scss">
  .filter-group {
    border: 1px solid var(--color-border-raised-1);
  }
</style>
