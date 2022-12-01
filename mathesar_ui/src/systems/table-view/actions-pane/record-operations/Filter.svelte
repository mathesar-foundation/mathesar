<script lang="ts">
  import { writable } from 'svelte/store';
  import type { Writable } from 'svelte/store';
  import { Button, Icon } from '@mathesar-component-library';
  import {
    getTabularDataStoreFromContext,
    type Filtering,
  } from '@mathesar/stores/table-data';
  import type { FilterCombination } from '@mathesar/api/tables/records';
  import { validateFilterEntry } from '@mathesar/components/filter-entry';
  import FilterEntries from './FilterEntries.svelte';
  import { deepCloneFiltering } from './utils';
  import { iconAddNew } from '@mathesar/icons';

  const tabularData = getTabularDataStoreFromContext();

  export let filtering: Writable<Filtering>;

  // This component is not reactive towards $filtering
  // to avoid having to sync states and handle unnecessary set calls,
  // since each set call triggers requests.
  // This should be okay since this component is re-created
  // everytime the dropdown reopens.
  const internalFiltering = writable(deepCloneFiltering($filtering));

  $: ({ processedColumns } = $tabularData);
  $: filterCount = $internalFiltering.entries.length;

  function checkAndSetExternalFiltering() {
    const validFilters = $internalFiltering.entries.filter((filter) => {
      const column = $processedColumns.get(filter.columnId);
      const condition = column?.allowedFiltersMap.get(filter.conditionId);
      if (condition) {
        return validateFilterEntry(condition, filter.value);
      }
      return false;
    });
    const newFiltering = deepCloneFiltering({
      ...$internalFiltering,
      entries: validFilters,
    });
    if ($filtering.equals(newFiltering)) {
      return;
    }
    filtering.set(newFiltering);
  }

  function addFilter() {
    const firstColumn = [...$processedColumns.values()][0];
    if (!firstColumn) {
      return;
    }
    const firstCondition = [...firstColumn.allowedFiltersMap.values()][0];
    if (!firstCondition) {
      return;
    }
    const newFilter = {
      columnId: firstColumn.column.id,
      conditionId: firstCondition.id,
      value: undefined,
      isValid: validateFilterEntry(firstCondition, undefined),
    };
    internalFiltering.update((f) => f.withEntry(newFilter));
    checkAndSetExternalFiltering();
  }

  function removeFilter(index: number) {
    internalFiltering.update((f) => f.withoutEntry(index));
    checkAndSetExternalFiltering();
  }

  function setCombination(combination: FilterCombination) {
    internalFiltering.update((f) => f.withCombination(combination));
    checkAndSetExternalFiltering();
  }

  function updateFilter() {
    checkAndSetExternalFiltering();
  }
</script>

<div class="filters" class:filtered={filterCount}>
  <div class="header">Filter records</div>
  <div class="content">
    {#if filterCount}
      <FilterEntries
        bind:entries={$internalFiltering.entries}
        bind:filterCombination={$internalFiltering.combination}
        on:remove={(e) => removeFilter(e.detail)}
        on:update={updateFilter}
        on:updateCombination={(e) => setCombination(e.detail)}
      />
    {:else}
      <span>No filters have been added</span>
    {/if}
  </div>
  {#if $processedColumns.size}
    <div class="footer">
      <Button appearance="secondary" on:click={addFilter}>
        <Icon {...iconAddNew} />
        <span>Add new filter</span>
      </Button>
    </div>
  {/if}
</div>

<style lang="scss">
  .filters {
    padding: 1rem;
    display: flex;
    flex-direction: column;

    > :global(* + *) {
      margin-top: 1rem;
    }

    .header {
      font-weight: bolder;
    }
  }
</style>
